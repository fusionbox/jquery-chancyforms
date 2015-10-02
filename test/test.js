describe('chancyforms', function() {
    'use strict';

    var $obj;

    function append(content) {
        return $(content).appendTo('body');
    }

    function remove() {
        $obj.remove();
    }

    function appendTextInput() {
        $obj = append('<input type="text">');
    }

    function appendCheckboxInput() {
        $obj = append('<input type="checkbox" name="field" value="a">' +
                      '<input type="checkbox" name="field" value="b">' +
                      '<input type="checkbox" name="field" value="c">');
    }

    function appendRadioInput() {
        $obj = append('<input type="radio" name="field" value="a">' +
                      '<input type="radio" name="field" value="b">' +
                      '<input type="radio" name="field" value="c">');
    }

    function appendSelect() {
        $obj = append('<select>' +
                        '<option value="a">A</option>' +
                        '<option value="b">B</option>' +
                        '<option value="c">C</option>' +
                      '</select>');
    }

    function appendMultipleSelect() {
        $obj = append('<select multiple>' +
                        '<option value="a">A</option>' +
                        '<option value="b">B</option>' +
                        '<option value="c">C</option>' +
                      '</select>');
    }

    this.timeout(500);

    describe('$.fn.chance', function() {
        beforeEach(appendTextInput);
        afterEach(remove);

        describe('when called', function() {
            it('should return the jQuery object', function() {
                expect($obj.chance()).to.equal($obj);
            });

            it('should clear data if given no arguments', function() {
                $obj.data('chance', [['a', 'b', 'c']]);
                expect($obj.chance().data('chance')).to.not.exist;
            });

            it('should clear data if given a null argument', function() {
                $obj.data('chance', [['a', 'b', 'c']]);
                expect($obj.chance(null).data('chance')).to.not.exist;
            });
        });

        describe('when called with an invalid argument', function() {
            it('should throw a type error if the argument is a number', function() {
                expect($obj.chance.bind($obj, 1)).to.throw(TypeError);
            });

            it('should throw a type error if the argument is a boolean', function() {
                expect($obj.chance.bind($obj, true)).to.throw(TypeError);
            });
        });

        describe('when called with an object argument', function() {
            it('should extend the default options with the object', function() {
                $obj.chance({allowBlank: true});
                expect($obj.data('chance').opts).to.contain.keys('allowBlank');
                expect($obj.data('chance').opts.allowBlank).to.be.true;
            });
        });

        describe('when called with sequential object arguments', function() {
            it('should extend the default options with each object', function() {
                $obj.chance({allowBlank: true}, {allowMultiple: false});
                expect($obj.data('chance').opts).to.contain.keys('allowBlank', 'allowMultiple');
                expect($obj.data('chance').opts.allowBlank).to.be.true;
                expect($obj.data('chance').opts.allowMultiple).to.be.false;
            });
        });

        describe('when called with a function argument', function() {
            it('should store default options', function() {
                $obj.chance(function() {});
                expect($obj.data('chance')).to.contain.keys('opts');
                expect($obj.data('chance').opts).to.be.an('object');
            });

            it('should store a function', function() {
                var fn = function() {
                    return 'a';
                };
                $obj.chance(fn);
                expect($obj.data('chance').fill).to.be.a('function');
                expect($obj.data('chance').fill()).to.satisfy(function(ret) {
                    return ret === fn();
                });
            });

            it('should replace existing data', function() {
                $obj.data('chance', 'stored data');
                $obj.chance(function() {});
                expect($obj.data('chance').fill).to.be.a('function');
            });
        });

        describe('when called with an array argument', function() {
            it('should store default options', function() {
                $obj.chance(['a', 'b', 'c']);
                expect($obj.data('chance')).to.contain.keys('opts');
                expect($obj.data('chance').opts).to.be.an('object');
            });

            it('should store a function', function() {
                var arr = ['a', 'b', 'c']
                $obj.chance(arr);
                expect($obj.data('chance').fill).to.be.a('function');
            });

            it('should store a function that picks from the stored array', function() {
                var arr = ['a', 'b', 'c'];
                $obj.chance(arr);
                expect(arr).to.contain($obj.data('chance').fill());
            });

            it('should replace existing data', function() {
                $obj.data('chance', 'stored data');
                $obj.chance(['a', 'b', 'c']);
                expect($obj.data('chance').fill).to.be.a('function');
            });
        });

        describe('when called with a string argument', function() {
            it('should store a function if string is a chance.js key name', function() {
                $obj.chance('state');
                expect($obj.data('chance').fill).to.be.a('function');
            });

            it('should replace existing data if string is a chance.js key name', function() {
                $obj.data('chance', 'stored data');
                $obj.chance('state');
                expect($obj.data('chance').fill).to.be.a('function');
            });

            it('should throw type error if string is not a chance.js key name', function() {
                expect($obj.chance.bind($obj, 'foo')).to.throw(TypeError);
            });
        });
    });

    describe('$.fn.fill', function() {
        describe('when called', function() {
            beforeEach(appendTextInput);
            afterEach(remove);

            it('should return the jQuery object', function() {
                expect($obj.fill()).to.equal($obj);
            });
        });

        describe('when called on checkbox input elements', function() {
            beforeEach(appendCheckboxInput);
            afterEach(remove);

            it('should choose something', function() {
                $obj.fill();
                expect($('input[name=field]:checked')).to.have.length.above(0);
            });

            it('should occasionally choose nothing if allowBlank is set', function(done) {
                $obj.chance({allowBlank: true, overwrite: true});
                setTimeout(function repeat() {
                    $obj.fill();
                    if ($('input[name=field]:checked').length === 0) {
                        done();
                    } else {
                        repeat();
                    }
                });
            });

            it('should occasionally choose more than one thing if allowMultiple is set', function(done) {
                $obj.chance({allowMultiple: true, overwrite: true});
                setTimeout(function repeat() {
                    $obj.fill();
                    if ($('input[name=field]:checked').length > 1) {
                        done();
                    } else {
                        repeat();
                    }
                });
            });

            describe('after $.fn.chance has been called with an array', function() {
                it('should choose something', function() {
                    var arr = ['a', 'b', 'c'];
                    $obj.chance(arr).fill();
                    expect($('input[name=field]:checked')).to.have.length.above(0);
                });

                it('should occasionally choose nothing if allowBlank is set', function(done) {
                    var arr = ['a', 'b', 'c'];
                    $obj.chance({allowBlank: true, overwrite: true}, arr);
                    setTimeout(function repeat() {
                        $obj.fill();
                        if ($('input[name=field]:checked').length === 0) {
                            done();
                        } else {
                            repeat();
                        }
                    });
                });

                it('should occasionally choose more than one thing if allowMultiple is set', function(done) {
                    var arr = ['a', 'b', 'c'];
                    $obj.chance({allowMultiple: true, overwrite: true}, arr);
                    setTimeout(function repeat() {
                        $obj.fill();
                        if ($('input[name=field]:checked').length > 1) {
                            done();
                        } else {
                            repeat();
                        }
                    });
                });
            });
        });

        describe('when called on radio input elements', function() {
            beforeEach(appendRadioInput);
            afterEach(remove);

            it('should choose something', function() {
                $obj.fill();
                expect($('input[name=field]:checked')).to.have.length.above(0);
            });

            it('should occasionally choose nothing if allowBlank is set', function(done) {
                $obj.chance({allowBlank: true, overwrite: true});
                setTimeout(function repeat() {
                    $obj.fill();
                    if ($('input[name=field]:checked').length === 0) {
                        done();
                    } else {
                        repeat();
                    }
                });
            });

            describe('after $.fn.chance has been called with an array', function() {
                it('should choose something', function() {
                    var arr = ['a', 'b', 'c'];
                    $obj.chance(arr).fill();
                    expect($('input[name=field]:checked')).to.have.length.above(0);
                });

                it('should occasionally choose nothing if allowBlank is set', function(done) {
                    var arr = ['a', 'b', 'c'];
                    $obj.chance({allowBlank: true, overwrite: true}, arr);
                    setTimeout(function repeat() {
                        $obj.fill();
                        if ($('input[name=field]:checked').length === 0) {
                            done();
                        } else {
                            repeat();
                        }
                    });
                });
            });
        });

        describe('when called on a select element', function() {
            beforeEach(appendSelect);
            afterEach(remove);

            it('should choose something', function() {
                $obj.fill();
                expect($('select option:selected')).to.have.length.above(0);
            });

            it('should occasionally choose nothing if allowBlank is set', function(done) {
                $obj.chance({allowBlank: true, overwrite: true});
                setTimeout(function repeat() {
                    $obj.fill();
                    if ($('select option:selected').length === 0) {
                        done();
                    } else {
                        repeat();
                    }
                });
            });

            describe('after $.fn.chance has been called with an array', function() {
                it('should choose something', function() {
                    var arr = ['a', 'b', 'c'];
                    $obj.chance(arr).fill();
                    expect($('select option:selected')).to.have.length.above(0);
                });

                it('should occasionally choose nothing if allowBlank is set', function(done) {
                    var arr = ['a', 'b', 'c'];
                    $obj.chance({allowBlank: true, overwrite: true});
                    setTimeout(function repeat() {
                        $obj.fill();
                        if ($('select option:selected').length === 0) {
                            done();
                        } else {
                            repeat();
                        }
                    });
                });
            });
        });

        describe('when called on select element with a multiple attribute present', function() {
            beforeEach(appendMultipleSelect);
            afterEach(remove);

            it('should occasionally choose more than one thing if allowMultiple is set', function(done) {
                $obj.chance({allowMultiple: true, overwrite: true});
                setTimeout(function repeat() {
                    $obj.fill();
                    if ($('select option:selected').length > 1) {
                        done();
                    } else {
                        repeat();
                    }
                });
            });
        });
    });
});
