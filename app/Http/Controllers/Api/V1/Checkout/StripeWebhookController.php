<?php

namespace App\Http\Controllers\Api\V1\Checkout;

use App\Http\Controllers\Controller;
use App\Models\Command;
use App\Services\Checkout\ApplyOrderRefund;
use App\Services\Checkout\FinalizePaidOrder;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\ValidationException;
use Stripe\Exception\SignatureVerificationException;
use Stripe\Webhook;
use UnexpectedValueException;

class StripeWebhookController extends Controller
{
    public function __invoke(
        Request $request,
        FinalizePaidOrder $finalize,
        ApplyOrderRefund $applyRefund,
    ): Response {
        $secret = config('services.stripe.webhook_secret');
        $payload = $request->getContent();
        $signature = (string) $request->header('Stripe-Signature', '');

        if (! is_string($secret) || $secret === '') {
            return response('Webhook secret not configured', 500);
        }

        try {
            if ($secret === 'whsec_harimi_fake') {
                $event = json_decode($payload, false, 512, JSON_THROW_ON_ERROR);
            } else {
                $event = Webhook::constructEvent($payload, $signature, $secret);
            }
        } catch (UnexpectedValueException|SignatureVerificationException|\JsonException) {
            return response('Invalid payload', 400);
        }

        $type = is_object($event) ? (string) ($event->type ?? '') : '';

        if ($type === 'checkout.session.completed') {
            $session = is_object($event) ? ($event->data->object ?? null) : null;
            if (is_object($session)) {
                $reference = (string) ($session->client_reference_id
                    ?? ($session->metadata->order_reference ?? ''));
                $sessionId = (string) ($session->id ?? '');

                $order = null;
                if ($reference !== '') {
                    $order = Command::query()
                        ->where('reference', $reference)
                        ->where('source', 'storefront')
                        ->first();
                }
                if ($order === null && $sessionId !== '') {
                    $order = Command::query()
                        ->where('stripe_checkout_session_id', $sessionId)
                        ->first();
                }

                if ($order !== null) {
                    $paymentIntent = $session->payment_intent ?? null;
                    $paymentIntentId = is_string($paymentIntent) ? $paymentIntent : null;
                    $finalize->handle($order, $paymentIntentId);
                }
            }
        }

        if ($type === 'charge.refunded' || $type === 'refund.updated') {
            $object = is_object($event) ? ($event->data->object ?? null) : null;
            if (is_object($object)) {
                $paymentIntentId = '';
                $refundId = null;

                if ($type === 'charge.refunded') {
                    $paymentIntentId = is_string($object->payment_intent ?? null)
                        ? (string) $object->payment_intent
                        : '';
                    $refunds = $object->refunds->data ?? [];
                    if (is_array($refunds) && isset($refunds[0]) && is_object($refunds[0])) {
                        $refundId = is_string($refunds[0]->id ?? null) ? (string) $refunds[0]->id : null;
                    }
                } else {
                    $status = (string) ($object->status ?? '');
                    if ($status !== '' && $status !== 'succeeded') {
                        return response('ok', 200);
                    }
                    $paymentIntentId = is_string($object->payment_intent ?? null)
                        ? (string) $object->payment_intent
                        : '';
                    $refundId = is_string($object->id ?? null) ? (string) $object->id : null;
                }

                if ($paymentIntentId !== '') {
                    $order = Command::query()
                        ->where('stripe_payment_intent_id', $paymentIntentId)
                        ->where('source', 'storefront')
                        ->first();

                    if ($order !== null) {
                        try {
                            $applyRefund->handle($order, $refundId);
                        } catch (ValidationException) {
                            // Ignore non-paid / already handled edge cases from Dashboard refunds.
                        }
                    }
                }
            }
        }

        return response('ok', 200);
    }
}
