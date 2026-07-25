<?php

namespace App\Enums;

enum MerchandisingShelf: string
{
    case BestSellers = 'best_sellers';
    case NewArrivals = 'new_arrivals';
    case Featured = 'featured';
    case SpecialOffers = 'special_offers';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
