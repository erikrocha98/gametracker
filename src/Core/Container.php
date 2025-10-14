<?php

namespace Core;

use Exception;
use ReflectionClass;
use Reflector;

class Container
{
    private static $instances = [];
    private static $bindings = [];

    public static function bind(string $abstract, callable $concrete): void
    {
        self::$bindings[$abstract] = $concrete;
    }

    public static function singleton(string $abstract, callable $concrete): void
    {
        self::bind($abstract, function () use ($abstract, $concrete) {
            if (!isset(self::$instances[$abstract])) {
                self::$instances[$abstract] = $concrete();
            }
            return self::$instances[$abstract];
        });
    }

    public static function get(string $abstract)
    {
        if (!isset(self::$bindings[$abstract])) {
            return self::$bindings[$abstract]();
        }
        return self::resolve($abstract);
    }

    private static function resolve(string $class){
        if(!class_exists($class)){
            throw new Exception("Classe {$class} não existe");
        }

        $reflector = new \ReflectionClass($class);

        if(!$reflector->isInstantiable()){
            throw new Exception("Classe {$class} não é instanciável");
        }

        $constructor = $reflector->getConstructor();

        if(is_null($constructor)){
            return new $class;
        }

        $parameters = $constructor->getParameters();
        $dependencies= [];

        foreach($parameters as $parameter) {
            $type = $parameter->getType();
            if(!$type || $type->isBuiltin()){
                throw new Exception("Parâmetro {$parameter} não pode ser resolvido.");
            }
            $dependencies = self::get($type->getName());
        }

        return $reflector->newInstanceArgs($dependencies);

    }

    public static function clear():void{
        self::$instances= [];
        self::$bindings= [];
    }
}
