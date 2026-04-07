<?php

namespace App\States\Rto;

class Returned extends RtoState
{
    public function label(): string
    {
        return 'Needs Revision';
    }
}
