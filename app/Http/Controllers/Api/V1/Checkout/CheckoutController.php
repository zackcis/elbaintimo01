<?php

namespace App\Http\Controllers\Api\V1\Checkout;

use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Checkout\CheckoutPreviewRequest;
use App\Http\Requests\Api\V1\Checkout\StoreCheckoutOrderRequest;
use App\Http\Resources\Api\V1\CheckoutOrderResource;
use App\Models\Command;
use App\Services\Checkout\CheckoutPricingService;
use App\Services\Checkout\CreateGuestCheckoutOrder;
use App\Services\Checkout\CreateStripeCheckoutSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CheckoutController extends Controller
{
    public function preview(CheckoutPreviewRequest $request, CheckoutPricingService $pricing): JsonResponse
    {
        $locale = (string) $request->attributes->get('storefront_locale');

        $quote = $pricing->preview(
            $request->validated('items'),
            $locale,
        );

        $status = $quote['available'] ? 200 : 422;

        return response()->json([
            'data' => $quote,
            'meta' => ['locale' => $locale],
        ], $status);
    }

    public function store(
        StoreCheckoutOrderRequest $request,
        CreateGuestCheckoutOrder $createOrder,
        CreateStripeCheckoutSession $createSession,
    ): JsonResponse {
        $locale = (string) $request->attributes->get('storefront_locale');
        $validated = $request->validated();
        $validated['locale'] = $locale;
        $validated['billing_same_as_shipping'] = $request->boolean('billing_same_as_shipping', true);

        $order = $createOrder->handle($validated);

        if ($order->payment_status === PaymentStatus::PendingPayment) {
            $successUrl = $this->resolveReturnUrl(
                (string) $validated['success_url'],
                $order,
            );
            $cancelUrl = $this->resolveReturnUrl(
                (string) $validated['cancel_url'],
                $order,
            );

            $session = $createSession->handle($order, $successUrl, $cancelUrl);
            $order->refresh()->load('items');
            $order->setAttribute('checkout_url', $session->url);
        }

        return (new CheckoutOrderResource($order))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, string $reference): JsonResponse
    {
        $token = (string) $request->query('token', '');

        $order = Command::query()
            ->with('items')
            ->where('reference', $reference)
            ->where('source', 'storefront')
            ->first();

        if ($order === null || $token === '' || ! hash_equals((string) $order->confirmation_token, $token)) {
            abort(404);
        }

        return (new CheckoutOrderResource($order))->response();
    }

    private function resolveReturnUrl(string $url, Command $order): string
    {
        return str_replace(
            ['{ORDER_REFERENCE}', '{CONFIRMATION_TOKEN}'],
            [$order->reference, (string) $order->confirmation_token],
            $url,
        );
    }
}
