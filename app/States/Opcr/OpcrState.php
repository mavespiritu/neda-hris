<?php

namespace App\States\Opcr;

use Spatie\ModelStates\State;
use Spatie\ModelStates\StateConfig;

abstract class OpcrState extends State
{
    abstract public function label(): string;

    public static function config(): StateConfig
    {
        return parent::config()
            ->default(Draft::class)
            ->allowTransition(Draft::class, Draft::class, Transitions\InitializeOpcrRecord::class);
    }
}
