# Chancy Forms for jQuery

A jQuery plugin that takes the pain out of QA testing html forms. Fill fields, or entire forms of fields with random values.
Select field elements to fill using jQuery objects. Additionally customize and change the values Chancy Forms uses to fill those elements.

Fills these elements:
* `<input type="checkbox">`
* `<input type="color">`
* `<input type="date">`
* `<input type="color">`
* `<input type="date">`
* `<input type="datetime-local">`
* `<input type="email">`
* `<input type="file">`
* `<input type="image">`
* `<input type="month">`
* `<input type="number">`
* `<input type="password">`
* `<input type="radio">`
* `<input type="range">`
* `<input type="range">`
* `<input type="search">`
* `<input type="tel">`
* `<input type="text">`
* `<input type="time">`
* `<input type="url">`
* `<input type="week">`
* `<select>`
* `<textarea>`

## Usage

Simply include `jquery-chancyforms.js` in a script tag and you're on your way.

Requires:
* [jQuery](http://jquery.com/)
* [Chance.js](http://chancejs.com/)

## .chance()

__.chance([&#8230;options] [, fill] [, &#8230;args])__

This method is used to store the fill method and options that determine what values will potentially fill the field elements in the selection `.chance()` was called on.

### Params

#### options

Zero or more objects containing options key, value pairs. (See `$.fn.chance.defaults` below).

#### fill

Optional. Can be one of:

1. A function that returns a value
2. the string name of a `chance` method to call
3. an array of values to pick from.

For all the `chance` methods available for use, check out the [Chance.js documentation](http://chancejs.com/#basics).

#### args

Zero or more arguments to pass to the fill function. Must follow a valid fill parameter. If the fill parameter is an array, args will be ignored.

## .fill()

__.fill([tempOpts])__

This is the method that actually fills the field elements of the selection with values. If `.chance()` was previously called on the selection, `.fill()` will use the fill method and options defined in that call. If not, each element type comes with a sensible, default fill method that produces random values to use.

### Params

#### tempOpts

Optional object containing temporary options key, value pairs to use only for this invocation of `.fill()`. (See `$.fn.chance.defaults` below).

## $.fn.chance.defaults

This is an object containing the options key, value pairs that all fill methods use by default.
Though you can change the values of individual options in this object itself, it is recommended to instead overwrite the value of those options in a .chance() call on a specific selector.

### Properties

#### allowBlank

(Boolean) Should `input[type=checkbox]`, `input[type=radio]`, or `select` selections be allowed to fill with no value?

#### allowMultiple

(Boolean) Should `input[type=checkbox]` or `select[multiple]` selections be allowed to fill with more than one value?

#### overwrite

(Boolean) Should the selection fill with a new value if one is already present?

## Examples

Fill input fields with the appropriate random content for their element types:

~~~js
$('input').fill();
~~~

Check zero, one or many values in the group of checkbox elements sharing the same name attribute:

~~~js
$('input[type=checkbox]').fill();
~~~

Similar to above, but check zero, one or many values solely from the given array:
_Note that the items in the array should all be values of elements in the selection_

~~~js
$('input[type=checkbox]').chance(['en', 'fr', 'de']).fill();
~~~

same as above, but only allow the fill method to pick zero or one value:

~~~js
$('input[type=checkbox]').chance({allowmultiple: false}, ['en', 'fr', 'de']).fill();
~~~

same as above, but only allow the fill method to pick one value:

~~~js
$('input[type=checkbox]').chance({allowmultiple: false, allowblank: false}, ['en', 'fr', 'de']).fill();
~~~

Fill with a value from [`chance.state()`](http://chancejs.com/#state):

~~~js
$('select.state').chance('state').fill();
~~~

same as above, but pass additional arguments to `chance.state()` to change the outcome:

~~~js
$('select.state').chance('state', {full: true, territories: true}).fill();
~~~

remove stored fill options and method on a selection:

~~~js
$('input').chance();
~~~

Overwrite all values for every element in a form:

~~~js
$('form').fill({overwrite: true});
~~~
