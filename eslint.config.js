"use strict";

module.exports = [
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "commonjs",
            globals: {
                Buffer: "readonly",
                Promise: "readonly",
                console: "readonly",
                describe: "readonly",
                exports: "writable",
                it: "readonly",
                module: "writable",
                require: "readonly"
            }
        },
        rules: {
            "no-undef": "error",
            "no-unused-vars": ["error", {args: "none"}]
        }
    }
];
