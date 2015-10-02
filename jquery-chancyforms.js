(function($, chance) {
    'use strict';

    if ($.type(chance) !== 'object') {
        throw new Error('chance object not found.');
    }

    // Helper function to get the actual element(s) that hold
    // the values that form the set of options for the jQuery object.
    $.fn.valueSetSelection = function() {
        if (this.is('select')) {
            return $('option', this);
        } else {
            return this;
        }
    };

    // Helper function to get the element(s) that return
    // the selected value(s) for the jQuery object.
    $.fn.valueSelection = function() {
        if (this.is('input[type=checkbox]') || this.is('input[type=radio]')) {
            return this.filter(':checked');
        } else {
            return this;
        }
    };

    // Helper function to get the set of values on a jQuery object
    // Acts similar to .map().
    $.fn.values = function() {
        return this.pushStack($.map(this, function(elem) {
            var val = $(elem).val();

            if ($.type(val) === 'undefined' || val === '') {
                return null;
            } else {
                return val;
            }
        }));
    };


    /**
     * Configure the fill options and method to use on this selection
     *
     * @param {...Object} [options] Zero or more objects containing options {key: value} pairs
     * @param {(function|string|Array)} [fill] Function, name of chance method to call, or an array of values to pick from
     * @param {...*} [args] Zero or more arguments to pass to the fill function
     * @return {jQuery} The jQuery object the chance method was called on
     * @throws {TypeError} fill argument must meet the listed criteria
     */
    $.fn.chance = function() {
        var args = Array.prototype.slice.call(arguments),
            data = this.data('chance'),
            head, fill, opts;

        if (args.length === 0 || $.type(args[0]) === 'null') {
            return this.removeData('chance');
        }

        if ($.type(data) !== 'object') {
            data = {};
        }
        if (Object.hasOwnProperty.call(data, 'fill') && $.type(fill) === 'function') {
            fill = data.fill;
        }
        opts = (Object.hasOwnProperty.call(data, 'opts') && $.type(opts) === 'object') ?
            data.opts : {};

        while ($.type(head = args.shift()) === 'object') {
            opts = $.extend(opts, head);
        }

        switch ($.type(head)) {
            case 'undefined':
                break;
            case 'array':
                fill = Function.prototype.call.bind(chance.pick, chance, head);
                opts.count = head.length;
                break;
            case 'function':
                fill = Function.prototype.apply.bind(head, this, args);
                delete opts.count;
                if (head === chance.weighted) {
                    opts.count = args[0].length;
                }
                break;
            case 'string':
                if ($.type(chance[head]) === 'function') {
                    fill = Function.prototype.apply.bind(chance[head], chance, args);
                    delete opts.count;
                    // special case: set count as length of first arg for `chance.pick` or `chance.weighted`
                    if (head === 'pick' || head === 'weighted') {
                        opts.count = args[0].length;
                    }
                    break;
                }
                // falls through
            default:
                throw new TypeError('First argument to $.fn.chance' +
                    ' must be an options object, an array to pick from, a function,' +
                    ' or the key name of a function on the chance object.');
        }

        data.fill = fill;
        data.opts = opts;
        return this.data('chance', data);
    };

    /**
     * Default options
     *
     * @property {boolean} allowBlank Should checkbox, radio, or select selections be allowed to select no value?
     * @property {boolean} allowMultiple Should checkbox or select[multiple] selections be allowed to select more than one value?
     * @property {boolean} overwrite Should selection fill with a new value if one already is present?
     */
    $.fn.chance.defaults = {
        allowBlank: false,
        allowMultiple: true,
        overwrite: false
    };

    /**
     * Fill this selection using its or the default fill options and method.
     *
     * @param {Object} [tempOpts] Optional object containing temporary options {key: value} pairs to use only for this invocation
     * @return {jQuery} The jQuery object the fill method was called on
     */
    $.fn.fill = function(tempOpts) {
        var data = this.data('chance') || {},
            fill, opts, result;

        if (Object.hasOwnProperty.call(data, 'fill')) {
            fill = data.fill;
        }

        if (Object.hasOwnProperty.call(data, 'opts')) {
            opts = data.opts;
        }

        if (this.is('form')) {
            // apply $.fn.fill() to all the form's strategy-enabled elements
            opts = $.extend({}, opts, tempOpts);
            this.find($.map($.fn.chance.strategies, function(item) {
                return item[0];
            }).join()).each(function(_, elem) {
                $(elem).fill(opts);
            });
        } else {
            opts = $.extend({}, $.fn.chance.defaults, opts, tempOpts);
            $.each($.fn.chance.strategies, $.proxy(function(_, item) {
                var selector = item[0],
                    strategy = item[1],
                    $target, name;

                if (this.is(selector)) {
                    name = this.attr('name');

                    if (name && (selector === 'input[type=checkbox]' || selector === 'input[type=radio]')) {
                        $target = this.parent().find([selector, '[name=', name, ']'].join(''));
                    } else {
                        $target = this;
                    }
                    result = strategy.call($target, fill, opts);

                    return false;
                }
            }, this));
        }

        if (['undefined', 'null'].indexOf($.type(result)) < 0) {
            this.val(result);
        }

        return this;
    };

    function factorial(n) {
        if (n === 0) {
            return 1;
        }
        return n * factorial(n - 1);
    }

    function getCount(opts) {
        return $.type(opts.count) === 'number' ?
            opts.count : this.valueSetSelection().values().get().length;
    }

    function getWeight(opts) {
        var count = getCount.call(this, opts);

        if (opts.allowMultiple) {
            return factorial(count);
        } else {
            return count;
        }
    }

    function compose() {
        var fns = arguments,
            len = fns.length;

        return function() {
            var args = Array.prototype.slice.call(arguments),
                i = 0,
                result;

            while (i < len) {
                result = fns[i].apply(this, args)();
                if (['undefined', 'null'].indexOf($.type(result)) >= 0) {
                    break;
                }
                args.splice(0, 1, result);
                i++;
            }
            return result;
        };
    }

    function withDefault(fn) {
        return function(fill) {
            if ($.type(fill) !== 'function') {
                return Function.prototype.apply.bind(fn, this, arguments);
            } else {
                return function() {
                    return fill;
                };
            }
        };
    }

    function withOption(option, condition, fn) {
        if ($.type(condition) === 'function') {
            fn = condition;
            condition = true;
        }
        return function(fill, opts) {
            if (opts[option] === condition) {
                return Function.prototype.apply.bind(fn, this, arguments);
            } else {
                return function() {
                    return fill;
                };
            }
        };
    }

    function asArray() {
        return function(fill) {
            return Array.prototype.concat.bind([], fill());
        };
    }

    var transform = {
        // Uses the non-empty values of the associated form elements to create
        // a result array for `chance.pick` to choose from. Partially-applies
        // the array argument and returns the function.
        pickFromValues: function() {
            var $el = this.valueSetSelection();

            return chance.pick.bind(chance, $el.valueSetSelection().values());
        },
        // Passes the fill function on if a value is not present.
        // Stops execution of composed functions if the value is present.
        overwrite: function(fill) {
            var $el = this.valueSelection();

            if ($el.val()) {
                return null;
            } else {
                return fill;
            }
        },
        // Binds an integer argument between one and the options count
        // to the fill function and returns the partially-applied function.
        addMultiple: function(fill, opts) {
            var $el = this.valueSetSelection(),
                count = getCount.call($el, opts);

            return fill.bind(null, chance.integer({min: 1, max: count}));
        },
        // Binds two arguments to `chance.weighted`: an array containing the result of the
        // fill function followed by a null, and an array containing the associated weight for both.
        // Returns the partially-applied function.
        addBlank: function(fill, opts) {
            var $el = this.valueSetSelection(),
                weight = getWeight.call($el, opts);

            return chance.weighted.bind(chance, [fill(), null], [weight, 1]);
        }
    };

    // Fill strategies
    // arranged by descending specificity
    $.fn.chance.strategies = [
        ['input[type=color]', compose(
            withDefault(function() {
                return chance.color({format: 'hex'});
            }),
            withOption('overwrite', false, transform.overwrite)
        )],
        ['input[type=date]', compose(
            withDefault(function() {
                return chance.birthday().toISOString().split('T')[0];
            }),
            withOption('overwrite', false, transform.overwrite)
        )],
        ['input[type=datetime-local]', compose(
            withDefault(function() {
                return chance.birthday().toISOString().slice(0, -8);
            }),
            withOption('overwrite', false, transform.overwrite)
        )],
        ['input[type=email]', compose(
            withDefault(function() {
                return chance.email();
            }),
            withOption('overwrite', false, transform.overwrite)
        )],
        ['input[type=month]', compose(
            withDefault(function() {
                return chance.birthday().toISOString().slice(0, 7);
            }),
            withOption('overwrite', false, transform.overwrite)
        )],
        ['input[type=number]', compose(
            withDefault(function() {
                return chance.natural();
            }),
            withOption('overwrite', false, transform.overwrite)
        )],
        ['input[type=password]', compose(
            withDefault(function() {
                return chance.string();
            }),
            withOption('overwrite', false, transform.overwrite)
        )],
        ['input[type=range]', compose(
            withDefault(function() {
                var min = parseFloat(this.attr('min')),
                    max = parseFloat(this.attr('max')),
                    step = parseFloat(this.attr('step')),
                    values;

                if (isNaN(min)) {
                    min = 0;
                }
                if (isNaN(max)) {
                    max = 100;
                }
                if (isNaN(step) || step < 0) {
                    step = 1;
                }

                if (step === 1) {
                    return chance.integer({min: min, max: max});
                } else {
                    values = [];
                    for (var i = min; i < max; i += step) {
                        values.push(i);
                    }
                    return chance.pick(values);
                }
            }),
            withOption('overwrite', false, transform.overwrite)
        )],
        ['input[type=search]', compose(
            withDefault(function() {
                return chance.word();
            }),
            withOption('overwrite', false, transform.overwrite)
        )],
        ['input[type=tel]', compose(
            withDefault(function() {
                return chance.phone();
            }),
            withOption('overwrite', false, transform.overwrite)
        )],
        ['input[type=text]', compose(
            withDefault(function() {
                return chance.sentence();
            }),
            withOption('overwrite', false, transform.overwrite)
        )],
        ['input[type=time]', compose(
            withDefault(function() {
                return chance.birthday().toISOString().slice(11, 16);
            }),
            withOption('overwrite', false, transform.overwrite)
        )],
        ['input[type=url]', compose(
            withDefault(function() {
                return chance.url();
            }),
            withOption('overwrite', false, transform.overwrite)
        )],
        ['input[type=week]', compose(
            withDefault(function() {
                // Based on datepicker widget implementation from jQuery.ui
                var date = chance.birthday(),
                    time, week;

                date.setDate(date.getDate() + 4 - (date.getDay() || 7));
                time = date.getTime();
                date.setMonth(0);
                date.setDate(1);
                week = Math.floor(Math.round((time - date) / 86400000) / 7) + 1;
                return date.getFullYear() + '-W' + (week < 10 ? '0' + week : week);
            }),
            withOption('overwrite', false, transform.overwrite)
        )],
        ['input[type=checkbox]', compose(
            withDefault(transform.pickFromValues),
            withOption('overwrite', false, transform.overwrite),
            withOption('allowMultiple', transform.addMultiple),
            withOption('allowBlank', transform.addBlank),
            asArray()
        )],
        ['input[type=radio]', compose(
            withDefault(transform.pickFromValues),
            withOption('overwrite', false, transform.overwrite),
            withOption('allowBlank', transform.addBlank),
            asArray()
        )],
        ['select[multiple]', compose(
            withDefault(transform.pickFromValues),
            withOption('overwrite', false, transform.overwrite),
            withOption('allowMultiple', transform.addMultiple),
            withOption('allowBlank', transform.addBlank),
            asArray()
        )],
        ['select', compose(
            withDefault(transform.pickFromValues),
            withOption('overwrite', false, transform.overwrite),
            withOption('allowBlank', transform.addBlank),
            asArray()
        )],
        ['textarea', compose(
            withDefault(function() {
                return chance.paragraph();
            }),
            withOption('overwrite', false, transform.overwrite)
        )]
    ];
})(jQuery, chance);
