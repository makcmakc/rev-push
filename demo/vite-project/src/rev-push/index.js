 
    function Core (UIkit) {

        if (!inBrowser) {
            return;
        }

        // throttle 'resize'
        var pendingResize;
        var handleResize = function () {
            if (pendingResize) {
                return;
            }
            pendingResize = true;
            fastdom.write(function () { return pendingResize = false; });
            UIkit.update(null, 'resize');
        };

        on(window, 'load resize', handleResize);
        on(document, 'loadedmetadata load', handleResize, true);

        if ('ResizeObserver' in window) {
            (new ResizeObserver(handleResize)).observe(document.documentElement);
        }

        // throttle `scroll` event (Safari triggers multiple `scroll` events per frame)
        var pending;
        on(window, 'scroll', function (e) {

            if (pending) {
                return;
            }
            pending = true;
            fastdom.write(function () { return pending = false; });

            UIkit.update(null, e.type);

        }, {passive: true, capture: true});

        var started = 0;
        on(document, 'animationstart', function (ref) {
            var target = ref.target;

            if ((css(target, 'animationName') || '').match(/^uk-.*(left|right)/)) {

                started++;
                css(document.documentElement, 'overflowX', 'hidden');
                setTimeout(function () {
                    if (!--started) {
                        css(document.documentElement, 'overflowX', '');
                    }
                }, toMs(css(target, 'animationDuration')) + 100);
            }
        }, true);

        on(document, pointerDown, function (e) {

            if (!isTouch(e)) {
                return;
            }

            // Handle Swipe Gesture
            var pos = getEventPos(e);
            var target = 'tagName' in e.target ? e.target : parent(e.target);
            once(document, (pointerUp + " " + pointerCancel + " scroll"), function (e) {

                var ref = getEventPos(e);
                var x = ref.x;
                var y = ref.y;

                // swipe
                if (e.type !== 'scroll' && target && x && Math.abs(pos.x - x) > 100 || y && Math.abs(pos.y - y) > 100) {

                    setTimeout(function () {
                        trigger(target, 'swipe');
                        trigger(target, ("swipe" + (swipeDirection(pos.x, pos.y, x, y))));
                    });

                }

            });

        }, {passive: true});

    }

    function swipeDirection(x1, y1, x2, y2) {
        return Math.abs(x1 - x2) >= Math.abs(y1 - y2)
            ? x1 - x2 > 0
                ? 'Left'
                : 'Right'
            : y1 - y2 > 0
                ? 'Up'
                : 'Down';
    }

    function boot (UIkit) {

        var connect = UIkit.connect;
        var disconnect = UIkit.disconnect;

        if (!inBrowser || !window.MutationObserver) {
            return;
        }

        fastdom.read(function () {

            if (document.body) {
                apply(document.body, connect);
            }

            new MutationObserver(function (records) { return records.forEach(applyChildListMutation); }
            ).observe(document, {
                childList: true,
                subtree: true
            });

            new MutationObserver(function (records) { return records.forEach(applyAttributeMutation); }
            ).observe(document, {
                attributes: true,
                subtree: true
            });

            UIkit._initialized = true;
        });

        function applyChildListMutation(ref) {
            var addedNodes = ref.addedNodes;
            var removedNodes = ref.removedNodes;

            for (var i = 0; i < addedNodes.length; i++) {
                apply(addedNodes[i], connect);
            }

            for (var i$1 = 0; i$1 < removedNodes.length; i$1++) {
                apply(removedNodes[i$1], disconnect);
            }
        }

        function applyAttributeMutation(ref) {
            var target = ref.target;
            var attributeName = ref.attributeName;


            var name = getComponentName(attributeName);

            if (!name || !(name in UIkit)) {
                return;
            }

            if (hasAttr(target, attributeName)) {
                UIkit[name](target);
                return;
            }

            var component = UIkit.getComponent(target, name);

            if (component) {
                component.$destroy();
            }

        }

    }

    var Class = {

        connected: function() {
            !hasClass(this.$el, this.$name) && addClass(this.$el, this.$name);
        }

    };

    var Togglable = {

        props: {
            cls: Boolean,
            animation: 'list',
            duration: Number,
            origin: String,
            transition: String
        },

        data: {
            cls: false,
            animation: [false],
            duration: 200,
            origin: false,
            transition: 'linear',
            clsEnter: 'uk-togglabe-enter',
            clsLeave: 'uk-togglabe-leave',

            initProps: {
                overflow: '',
                height: '',
                paddingTop: '',
                paddingBottom: '',
                marginTop: '',
                marginBottom: ''
            },

            hideProps: {
                overflow: 'hidden',
                height: 0,
                paddingTop: 0,
                paddingBottom: 0,
                marginTop: 0,
                marginBottom: 0
            }

        },

        computed: {

            hasAnimation: function(ref) {
                var animation = ref.animation;

                return !!animation[0];
            },

            hasTransition: function(ref) {
                var animation = ref.animation;

                return this.hasAnimation && animation[0] === true;
            }

        },

        methods: {

            toggleElement: function(targets, toggle, animate) {
                var this$1 = this;

                return new Promise(function (resolve) { return Promise.all(toNodes(targets).map(function (el) {

                        var show = isBoolean(toggle) ? toggle : !this$1.isToggled(el);

                        if (!trigger(el, ("before" + (show ? 'show' : 'hide')), [this$1])) {
                            return Promise.reject();
                        }

                        var promise = (
                            isFunction(animate)
                                ? animate
                                : animate === false || !this$1.hasAnimation
                                ? this$1._toggle
                                : this$1.hasTransition
                                    ? toggleHeight(this$1)
                                    : toggleAnimation(this$1)
                        )(el, show);

                        var cls = show ? this$1.clsEnter : this$1.clsLeave;

                        addClass(el, cls);

                        trigger(el, show ? 'show' : 'hide', [this$1]);

                        var done = function () {
                            removeClass(el, cls);
                            trigger(el, show ? 'shown' : 'hidden', [this$1]);
                            this$1.$update(el);
                        };

                        return promise ? promise.then(done, function () {
                            removeClass(el, cls);
                            return Promise.reject();
                        }) : done();

                    })).then(resolve, noop); }
                );
            },

            isToggled: function(el) {
                if ( el === void 0 ) el = this.$el;

                return hasClass(el, this.clsEnter)
                    ? true
                    : hasClass(el, this.clsLeave)
                        ? false
                        : this.cls
                            ? hasClass(el, this.cls.split(' ')[0])
                            : !hasAttr(el, 'hidden');
            },

            _toggle: function(el, toggled) {

                if (!el) {
                    return;
                }

                toggled = Boolean(toggled);

                var changed;
                if (this.cls) {
                    changed = includes(this.cls, ' ') || toggled !== hasClass(el, this.cls);
                    changed && toggleClass(el, this.cls, includes(this.cls, ' ') ? undefined : toggled);
                } else {
                    changed = toggled === el.hidden;
                    changed && (el.hidden = !toggled);
                }

                $$('[autofocus]', el).some(function (el) { return isVisible(el) ? el.focus() || true : el.blur(); });

                if (changed) {
                    trigger(el, 'toggled', [toggled, this]);
                    this.$update(el);
                }
            }

        }

    };

    function toggleHeight(ref) {
        var isToggled = ref.isToggled;
        var duration = ref.duration;
        var initProps = ref.initProps;
        var hideProps = ref.hideProps;
        var transition = ref.transition;
        var _toggle = ref._toggle;

        return function (el, show) {

            var inProgress = Transition.inProgress(el);
            var inner = el.hasChildNodes ? toFloat(css(el.firstElementChild, 'marginTop')) + toFloat(css(el.lastElementChild, 'marginBottom')) : 0;
            var currentHeight = isVisible(el) ? height(el) + (inProgress ? 0 : inner) : 0;

            Transition.cancel(el);

            if (!isToggled(el)) {
                _toggle(el, true);
            }

            height(el, '');

            // Update child components first
            fastdom.flush();

            var endHeight = height(el) + (inProgress ? 0 : inner);
            height(el, currentHeight);

            return (show
                ? Transition.start(el, assign({}, initProps, {overflow: 'hidden', height: endHeight}), Math.round(duration * (1 - currentHeight / endHeight)), transition)
                : Transition.start(el, hideProps, Math.round(duration * (currentHeight / endHeight)), transition).then(function () { return _toggle(el, false); })
            ).then(function () { return css(el, initProps); });

        };
    }

    function toggleAnimation(cmp) {
        return function (el, show) {

            Animation.cancel(el);

            var animation = cmp.animation;
            var duration = cmp.duration;
            var _toggle = cmp._toggle;

            if (show) {
                _toggle(el, true);
                return Animation.in(el, animation[0], duration, cmp.origin);
            }

            return Animation.out(el, animation[1] || animation[0], duration, cmp.origin).then(function () { return _toggle(el, false); });
        };
    }

    var Accordion = {

        mixins: [Class, Togglable],

        props: {
            targets: String,
            active: null,
            collapsible: Boolean,
            multiple: Boolean,
            toggle: String,
            content: String,
            transition: String,
            offset: Number
        },

        data: {
            targets: '> *',
            active: false,
            animation: [true],
            collapsible: true,
            multiple: false,
            clsOpen: 'uk-open',
            toggle: '> .uk-accordion-title',
            content: '> .uk-accordion-content',
            transition: 'ease',
            offset: 0
        },

        computed: {

            items: {

                get: function(ref, $el) {
                    var targets = ref.targets;

                    return $$(targets, $el);
                },

                watch: function(items, prev) {
                    var this$1 = this;


                    items.forEach(function (el) { return hide($(this$1.content, el), !hasClass(el, this$1.clsOpen)); });

                    if (prev || hasClass(items, this.clsOpen)) {
                        return;
                    }

                    var active = this.active !== false && items[Number(this.active)]
                        || !this.collapsible && items[0];

                    if (active) {
                        this.toggle(active, false);
                    }

                },

                immediate: true

            },

            toggles: function(ref) {
                var toggle = ref.toggle;

                return this.items.map(function (item) { return $(toggle, item); });
            }

        },

        events: [

            {

                name: 'click',

                delegate: function() {
                    return ((this.targets) + " " + (this.$props.toggle));
                },

                handler: function(e) {
                    e.preventDefault();
                    this.toggle(index(this.toggles, e.current));
                }

            }

        ],

        methods: {

            toggle: function(item, animate) {
                var this$1 = this;


                var items = [this.items[getIndex(item, this.items)]];
                var activeItems = filter(this.items, ("." + (this.clsOpen)));

                if (!this.multiple && !includes(activeItems, items[0])) {
                    items = items.concat(activeItems);
                }

                if (!this.collapsible && activeItems.length < 2 && !filter(items, (":not(." + (this.clsOpen) + ")")).length) {
                    return;
                }

                items.forEach(function (el) { return this$1.toggleElement(el, !hasClass(el, this$1.clsOpen), function (el, show) {

                    toggleClass(el, this$1.clsOpen, show);
                    attr($(this$1.$props.toggle, el), 'aria-expanded', show);

                    var content = $(("" + (el._wrapper ? '> * ' : '') + (this$1.content)), el);

                    if (animate === false || !this$1.hasTransition) {
                        hide(content, !show);
                        return;
                    }

                    if (!el._wrapper) {
                        el._wrapper = wrapAll(content, ("<div" + (show ? ' hidden' : '') + ">"));
                    }

                    hide(content, false);
                    return toggleHeight(this$1)(el._wrapper, show).then(function () {
                        hide(content, !show);
                        delete el._wrapper;
                        unwrap(content);

                        if (show) {
                            var toggle = $(this$1.$props.toggle, el);
                            if (!isInView(toggle)) {
                                scrollIntoView(toggle, {offset: this$1.offset});
                            }
                        }
                    });
                }); });
            }

        }

    };

    function hide(el, hide) {
        el && (el.hidden = hide);
    }

    var alert = {

        mixins: [Class, Togglable],

        args: 'animation',

        props: {
            close: String
        },

        data: {
            animation: [true],
            selClose: '.uk-alert-close',
            duration: 150,
            hideProps: assign({opacity: 0}, Togglable.data.hideProps)
        },

        events: [

            {

                name: 'click',

                delegate: function() {
                    return this.selClose;
                },

                handler: function(e) {
                    e.preventDefault();
                    this.close();
                }

            }

        ],

        methods: {

            close: function() {
                var this$1 = this;

                this.toggleElement(this.$el).then(function () { return this$1.$destroy(true); });
            }

        }

    };

    function getPositionedParent(el) {
        while ((el = parent(el))) {
            if (css(el, 'position') !== 'static') {
                return el;
            }
        }
    }

    var Position = {

        props: {
            pos: String,
            offset: null,
            flip: Boolean,
            clsPos: String
        },

        data: {
            pos: ("bottom-" + (!isRtl ? 'left' : 'right')),
            flip: true,
            offset: false,
            clsPos: ''
        },

        computed: {

            pos: function(ref) {
                var pos = ref.pos;

                return (pos + (!includes(pos, '-') ? '-center' : '')).split('-');
            },

            dir: function() {
                return this.pos[0];
            },

            align: function() {
                return this.pos[1];
            }

        },

        methods: {

            positionAt: function(element, target, boundary) {

                removeClasses(element, ((this.clsPos) + "-(top|bottom|left|right)(-[a-z]+)?"));

                var ref = this;
                var offset$1 = ref.offset;
                var axis = this.getAxis();

                if (!isNumeric(offset$1)) {
                    var node = $(offset$1);
                    offset$1 = node
                        ? offset(node)[axis === 'x' ? 'left' : 'top'] - offset(target)[axis === 'x' ? 'right' : 'bottom']
                        : 0;
                }

                var ref$1 = positionAt(
                    element,
                    target,
                    axis === 'x' ? ((flipPosition(this.dir)) + " " + (this.align)) : ((this.align) + " " + (flipPosition(this.dir))),
                    axis === 'x' ? ((this.dir) + " " + (this.align)) : ((this.align) + " " + (this.dir)),
                    axis === 'x' ? ("" + (this.dir === 'left' ? -offset$1 : offset$1)) : (" " + (this.dir === 'top' ? -offset$1 : offset$1)),
                    null,
                    this.flip,
                    boundary
                ).target;
                var x = ref$1.x;
                var y = ref$1.y;

                this.dir = axis === 'x' ? x : y;
                this.align = axis === 'x' ? y : x;

                toggleClass(element, ((this.clsPos) + "-" + (this.dir) + "-" + (this.align)), this.offset === false);

            },

            getAxis: function() {
                return this.dir === 'top' || this.dir === 'bottom' ? 'y' : 'x';
            }

        }

    };

    var active;

    var drop = {

        mixins: [Position, Togglable],

        args: 'pos',

        props: {
            mode: 'list',
            toggle: Boolean,
            boundary: Boolean,
            boundaryAlign: Boolean,
            delayShow: Number,
            delayHide: Number,
            clsDrop: String
        },

        data: {
            mode: ['click', 'hover'],
            toggle: '- *',
            boundary: true,
            boundaryAlign: false,
            delayShow: 0,
            delayHide: 800,
            clsDrop: false,
            animation: ['uk-animation-fade'],
            cls: 'uk-open'
        },

        computed: {

            boundary: function(ref, $el) {
                var boundary = ref.boundary;

                return boundary === true ? window : query(boundary, $el);
            },

            clsDrop: function(ref) {
                var clsDrop = ref.clsDrop;

                return clsDrop || ("uk-" + (this.$options.name));
            },

            clsPos: function() {
                return this.clsDrop;
            }

        },

        created: function() {
            this.tracker = new MouseTracker();
        },

        connected: function() {

            addClass(this.$el, this.clsDrop);

            var ref = this.$props;
            var toggle = ref.toggle;
            this.toggle = toggle && this.$create('toggle', query(toggle, this.$el), {
                target: this.$el,
                mode: this.mode
            });

        },

        disconnected: function() {
            if (this.isActive()) {
                active = null;
            }
        },

        events: [

            {

                name: 'click',

                delegate: function() {
                    return ("." + (this.clsDrop) + "-close");
                },

                handler: function(e) {
                    e.preventDefault();
                    this.hide(false);
                }

            },

            {

                name: 'click',

                delegate: function() {
                    return 'a[href^="#"]';
                },

                handler: function(ref) {
                    var defaultPrevented = ref.defaultPrevented;
                    var hash = ref.current.hash;

                    if (!defaultPrevented && hash && !within(hash, this.$el)) {
                        this.hide(false);
                    }
                }

            },

            {

                name: 'beforescroll',

                handler: function() {
                    this.hide(false);
                }

            },

            {

                name: 'toggle',

                self: true,

                handler: function(e, toggle) {

                    e.preventDefault();

                    if (this.isToggled()) {
                        this.hide(false);
                    } else {
                        this.show(toggle, false);
                    }
                }

            },

            {

                name: 'toggleshow',

                self: true,

                handler: function(e, toggle) {
                    e.preventDefault();
                    this.show(toggle);
                }

            },

            {

                name: 'togglehide',

                self: true,

                handler: function(e) {
                    e.preventDefault();
                    this.hide();
                }

            },

            {

                name: (pointerEnter + " focusin"),

                filter: function() {
                    return includes(this.mode, 'hover');
                },

                handler: function(e) {
                    if (!isTouch(e)) {
                        this.clearTimers();
                    }
                }

            },

            {

                name: (pointerLeave + " focusout"),

                filter: function() {
                    return includes(this.mode, 'hover');
                },

                handler: function(e) {
                    if (!isTouch(e) && e.relatedTarget) {
                        this.hide();
                    }
                }

            },

            {

                name: 'toggled',

                self: true,

                handler: function(e, toggled) {

                    if (!toggled) {
                        return;
                    }

                    this.clearTimers();
                    this.position();
                }

            },

            {

                name: 'show',

                self: true,

                handler: function() {
                    var this$1 = this;


                    active = this;

                    this.tracker.init();

                    once(this.$el, 'hide', on(document, pointerDown, function (ref) {
                            var target = ref.target;

                            return !within(target, this$1.$el) && once(document, (pointerUp + " " + pointerCancel + " scroll"), function (ref) {
                            var defaultPrevented = ref.defaultPrevented;
                            var type = ref.type;
                            var newTarget = ref.target;

                            if (!defaultPrevented && type === pointerUp && target === newTarget && !(this$1.toggle && within(target, this$1.toggle.$el))) {
                                this$1.hide(false);
                            }
                        }, true);
                    }
                    ), {self: true});

                    once(this.$el, 'hide', on(document, 'keydown', function (e) {
                        if (e.keyCode === 27) {
                            this$1.hide(false);
                        }
                    }), {self: true});

                }

            },

            {

                name: 'beforehide',

                self: true,

                handler: function() {
                    this.clearTimers();
                }

            },

            {

                name: 'hide',

                handler: function(ref) {
                    var target = ref.target;


                    if (this.$el !== target) {
                        active = active === null && within(target, this.$el) && this.isToggled() ? this : active;
                        return;
                    }

                    active = this.isActive() ? null : active;
                    this.tracker.cancel();
                }

            }

        ],

        update: {

            write: function() {

                if (this.isToggled() && !hasClass(this.$el, this.clsEnter)) {
                    this.position();
                }

            },

            events: ['resize']

        },

        methods: {

            show: function(toggle, delay) {
                var this$1 = this;
                if ( toggle === void 0 ) toggle = this.toggle;
                if ( delay === void 0 ) delay = true;


                if (this.isToggled() && toggle && this.toggle && toggle.$el !== this.toggle.$el) {
                    this.hide(false);
                }

                this.toggle = toggle;

                this.clearTimers();

                if (this.isActive()) {
                    return;
                }

                if (active) {

                    if (delay && active.isDelaying) {
                        this.showTimer = setTimeout(this.show, 10);
                        return;
                    }

                    var prev;
                    while (active && prev !== active && !within(this.$el, active.$el)) {
                        prev = active;
                        active.hide(false);
                    }

                }

                this.showTimer = setTimeout(function () { return !this$1.isToggled() && this$1.toggleElement(this$1.$el, true); }, delay && this.delayShow || 0);

            },

            hide: function(delay) {
                var this$1 = this;
                if ( delay === void 0 ) delay = true;


                var hide = function () { return this$1.toggleElement(this$1.$el, false, false); };

                this.clearTimers();

                this.isDelaying = getPositionedElements(this.$el).some(function (el) { return this$1.tracker.movesTo(el); });

                if (delay && this.isDelaying) {
                    this.hideTimer = setTimeout(this.hide, 50);
                } else if (delay && this.delayHide) {
                    this.hideTimer = setTimeout(hide, this.delayHide);
                } else {
                    hide();
                }
            },

            clearTimers: function() {
                clearTimeout(this.showTimer);
                clearTimeout(this.hideTimer);
                this.showTimer = null;
                this.hideTimer = null;
                this.isDelaying = false;
            },

            isActive: function() {
                return active === this;
            },

            position: function() {

                removeClass(this.$el, ((this.clsDrop) + "-stack"));
                toggleClass(this.$el, ((this.clsDrop) + "-boundary"), this.boundaryAlign);

                var boundary = offset(this.boundary);
                var alignTo = this.boundaryAlign ? boundary : offset(this.toggle.$el);

                if (this.align === 'justify') {
                    var prop = this.getAxis() === 'y' ? 'width' : 'height';
                    css(this.$el, prop, alignTo[prop]);
                } else if (this.boundary && this.$el.offsetWidth > Math.max(boundary.right - alignTo.left, alignTo.right - boundary.left)) {
                    addClass(this.$el, ((this.clsDrop) + "-stack"));
                }

                this.positionAt(this.$el, this.boundaryAlign ? this.boundary : this.toggle.$el, this.boundary);

            }

        }

    };

    function getPositionedElements(el) {
        var result = [];
        apply(el, function (el) { return css(el, 'position') !== 'static' && result.push(el); });
        return result;
    }

    var formCustom = {

        mixins: [Class],

        args: 'target',

        props: {
            target: Boolean
        },

        data: {
            target: false
        },

        computed: {

            input: function(_, $el) {
                return $(selInput, $el);
            },

            state: function() {
                return this.input.nextElementSibling;
            },

            target: function(ref, $el) {
                var target = ref.target;

                return target && (target === true
                    && parent(this.input) === $el
                    && this.input.nextElementSibling
                    || query(target, $el));
            }

        },

        update: function() {

            var ref = this;
            var target = ref.target;
            var input = ref.input;

            if (!target) {
                return;
            }

            var option;
            var prop = isInput(target) ? 'value' : 'textContent';
            var prev = target[prop];
            var value = input.files && input.files[0]
                ? input.files[0].name
                : matches(input, 'select') && (option = $$('option', input).filter(function (el) { return el.selected; })[0]) // eslint-disable-line prefer-destructuring
                    ? option.textContent
                    : input.value;

            if (prev !== value) {
                target[prop] = value;
            }

        },

        events: [

            {
                name: 'change',

                handler: function() {
                    this.$update();
                }
            },

            {
                name: 'reset',

                el: function() {
                    return closest(this.$el, 'form');
                },

                handler: function() {
                    this.$update();
                }
            }

        ]

    };

    var SVG = {

        args: 'src',

        props: {
            id: Boolean,
            icon: String,
            src: String,
            style: String,
            width: Number,
            height: Number,
            ratio: Number,
            class: String,
            strokeAnimation: Boolean,
            focusable: Boolean, // IE 11
            attributes: 'list'
        },

        data: {
            ratio: 1,
            include: ['style', 'class', 'focusable'],
            class: '',
            strokeAnimation: false
        },

        beforeConnect: function() {
            this.class += ' uk-svg';
        },

        connected: function() {
            var this$1 = this;
            var assign;


            if (!this.icon && includes(this.src, '#')) {
                (assign = this.src.split('#'), this.src = assign[0], this.icon = assign[1]);
            }

            this.svg = this.getSvg().then(function (el) {

                if (this$1._connected) {

                    var svg = insertSVG(el, this$1.$el);

                    if (this$1.svgEl && svg !== this$1.svgEl) {
                        remove(this$1.svgEl);
                    }

                    this$1.applyAttributes(svg, el);
                    this$1.$emit();
                    return this$1.svgEl = svg;
                }

            }, noop);

        },

        disconnected: function() {
            var this$1 = this;


            this.svg.then(function (svg) {
                if (!this$1._connected) {

                    if (isVoidElement(this$1.$el)) {
                        this$1.$el.hidden = false;
                    }

                    remove(svg);
                    this$1.svgEl = null;
                }
            });

            this.svg = null;

        },

        update: {

            read: function() {
                return !!(this.strokeAnimation && this.svgEl && isVisible(this.svgEl));
            },

            write: function() {
                applyAnimation(this.svgEl);
            },

            type: ['resize']

        },

        methods: {

            getSvg: function() {
                var this$1 = this;

                return loadSVG(this.src).then(function (svg) { return parseSVG(svg, this$1.icon) || Promise.reject('SVG not found.'); }
                );
            },

            applyAttributes: function(el, ref) {
                var this$1 = this;


                for (var prop in this.$options.props) {
                    if (includes(this.include, prop) && (prop in this)) {
                        attr(el, prop, this[prop]);
                    }
                }

                for (var attribute in this.attributes) {
                    var ref$1 = this.attributes[attribute].split(':', 2);
                    var prop$1 = ref$1[0];
                    var value = ref$1[1];
                    attr(el, prop$1, value);
                }

                if (!this.id) {
                    removeAttr(el, 'id');
                }

                var props = ['width', 'height'];
                var dimensions = props.map(function (prop) { return this$1[prop]; });

                if (!dimensions.some(function (val) { return val; })) {
                    dimensions = props.map(function (prop) { return attr(ref, prop); });
                }

                var viewBox = attr(ref, 'viewBox');
                if (viewBox && !dimensions.some(function (val) { return val; })) {
                    dimensions = viewBox.split(' ').slice(2);
                }

                dimensions.forEach(function (val, i) { return attr(el, props[i], toFloat(val) * this$1.ratio || null); }
                );

            }

        }

    };

    var loadSVG = memoize(function (src) { return new Promise(function (resolve, reject) {

            if (!src) {
                reject();
                return;
            }

            if (startsWith(src, 'data:')) {
                resolve(decodeURIComponent(src.split(',')[1]));
            } else {

                ajax(src).then(
                    function (xhr) { return resolve(xhr.response); },
                    function () { return reject('SVG not found.'); }
                );

            }
        }); }
    );

    function parseSVG(svg, icon) {

        if (icon && includes(svg, '<symbol')) {
            svg = parseSymbols(svg, icon) || svg;
        }

        svg = $(svg.substr(svg.indexOf('<svg')));
        return svg && svg.hasChildNodes() && svg;
    }

    var symbolRe = /<symbol([^]*?id=(['"])(.+?)\2[^]*?<\/)symbol>/g;
    var symbols = {};

    function parseSymbols(svg, icon) {

        if (!symbols[svg]) {

            symbols[svg] = {};

            symbolRe.lastIndex = 0;

            var match;
            while ((match = symbolRe.exec(svg))) {
                symbols[svg][match[3]] = "<svg xmlns=\"http://www.w3.org/2000/svg\"" + (match[1]) + "svg>";
            }

        }

        return symbols[svg][icon];
    }

    function applyAnimation(el) {

        var length = getMaxPathLength(el);

        if (length) {
            el.style.setProperty('--uk-animation-stroke', length);
        }

    }

    function getMaxPathLength(el) {
        return Math.ceil(Math.max.apply(Math, [ 0 ].concat( $$('[stroke]', el).map(function (stroke) {
            try {
                return stroke.getTotalLength();
            } catch (e) {
                return 0;
            }
        }) )));
    }

    function insertSVG(el, root) {

        if (isVoidElement(root) || root.tagName === 'CANVAS') {

            root.hidden = true;

            var next = root.nextElementSibling;
            return equals(el, next)
                ? next
                : after(root, el);

        }

        var last = root.lastElementChild;
        return equals(el, last)
            ? last
            : append(root, el);
    }

    function equals(el, other) {
        return isSVG(el) && isSVG(other) && innerHTML(el) === innerHTML(other);
    }

    function isSVG(el) {
        return el && el.tagName === 'svg';
    }

    function innerHTML(el) {
        return (el.innerHTML || (new XMLSerializer()).serializeToString(el).replace(/<svg.*?>(.*?)<\/svg>/g, '$1')).replace(/\s/g, '');
    }

    var closeIcon = "<svg width=\"14\" height=\"14\" viewBox=\"0 0 14 14\" xmlns=\"http://www.w3.org/2000/svg\"><line fill=\"none\" stroke=\"#000\" stroke-width=\"1.1\" x1=\"1\" y1=\"1\" x2=\"13\" y2=\"13\"/><line fill=\"none\" stroke=\"#000\" stroke-width=\"1.1\" x1=\"13\" y1=\"1\" x2=\"1\" y2=\"13\"/></svg>";

    var closeLarge = "<svg width=\"20\" height=\"20\" viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><line fill=\"none\" stroke=\"#000\" stroke-width=\"1.4\" x1=\"1\" y1=\"1\" x2=\"19\" y2=\"19\"/><line fill=\"none\" stroke=\"#000\" stroke-width=\"1.4\" x1=\"19\" y1=\"1\" x2=\"1\" y2=\"19\"/></svg>";

    var marker = "<svg width=\"20\" height=\"20\" viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><rect x=\"9\" y=\"4\" width=\"1\" height=\"11\"/><rect x=\"4\" y=\"9\" width=\"11\" height=\"1\"/></svg>";

    var navbarToggleIcon = "<svg width=\"20\" height=\"20\" viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><rect y=\"9\" width=\"20\" height=\"2\"/><rect y=\"3\" width=\"20\" height=\"2\"/><rect y=\"15\" width=\"20\" height=\"2\"/></svg>";

    var overlayIcon = "<svg width=\"40\" height=\"40\" viewBox=\"0 0 40 40\" xmlns=\"http://www.w3.org/2000/svg\"><rect x=\"19\" y=\"0\" width=\"1\" height=\"40\"/><rect x=\"0\" y=\"19\" width=\"40\" height=\"1\"/></svg>";

    var paginationNext = "<svg width=\"7\" height=\"12\" viewBox=\"0 0 7 12\" xmlns=\"http://www.w3.org/2000/svg\"><polyline fill=\"none\" stroke=\"#000\" stroke-width=\"1.2\" points=\"1 1 6 6 1 11\"/></svg>";

    var paginationPrevious = "<svg width=\"7\" height=\"12\" viewBox=\"0 0 7 12\" xmlns=\"http://www.w3.org/2000/svg\"><polyline fill=\"none\" stroke=\"#000\" stroke-width=\"1.2\" points=\"6 1 1 6 6 11\"/></svg>";

    var searchIcon = "<svg width=\"20\" height=\"20\" viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"><circle fill=\"none\" stroke=\"#000\" stroke-width=\"1.1\" cx=\"9\" cy=\"9\" r=\"7\"/><path fill=\"none\" stroke=\"#000\" stroke-width=\"1.1\" d=\"M14,14 L18,18 L14,14 Z\"/></svg>";

    var searchLarge = "<svg width=\"40\" height=\"40\" viewBox=\"0 0 40 40\" xmlns=\"http://www.w3.org/2000/svg\"><circle fill=\"none\" stroke=\"#000\" stroke-width=\"1.8\" cx=\"17.5\" cy=\"17.5\" r=\"16.5\"/><line fill=\"none\" stroke=\"#000\" stroke-width=\"1.8\" x1=\"38\" y1=\"39\" x2=\"29\" y2=\"30\"/></svg>";

    var searchNavbar = "<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\"><circle fill=\"none\" stroke=\"#000\" stroke-width=\"1.1\" cx=\"10.5\" cy=\"10.5\" r=\"9.5\"/><line fill=\"none\" stroke=\"#000\" stroke-width=\"1.1\" x1=\"23\" y1=\"23\" x2=\"17\" y2=\"17\"/></svg>";

    var slidenavNext = "<svg width=\"14\" height=\"24\" viewBox=\"0 0 14 24\" xmlns=\"http://www.w3.org/2000/svg\"><polyline fill=\"none\" stroke=\"#000\" stroke-width=\"1.4\" points=\"1.225,23 12.775,12 1.225,1 \"/></svg>";

    var slidenavNextLarge = "<svg width=\"25\" height=\"40\" viewBox=\"0 0 25 40\" xmlns=\"http://www.w3.org/2000/svg\"><polyline fill=\"none\" stroke=\"#000\" stroke-width=\"2\" points=\"4.002,38.547 22.527,20.024 4,1.5 \"/></svg>";

    var slidenavPrevious = "<svg width=\"14\" height=\"24\" viewBox=\"0 0 14 24\" xmlns=\"http://www.w3.org/2000/svg\"><polyline fill=\"none\" stroke=\"#000\" stroke-width=\"1.4\" points=\"12.775,1 1.225,12 12.775,23 \"/></svg>";

    var slidenavPreviousLarge = "<svg width=\"25\" height=\"40\" viewBox=\"0 0 25 40\" xmlns=\"http://www.w3.org/2000/svg\"><polyline fill=\"none\" stroke=\"#000\" stroke-width=\"2\" points=\"20.527,1.5 2,20.024 20.525,38.547 \"/></svg>";

    var spinner = "<svg width=\"30\" height=\"30\" viewBox=\"0 0 30 30\" xmlns=\"http://www.w3.org/2000/svg\"><circle fill=\"none\" stroke=\"#000\" cx=\"15\" cy=\"15\" r=\"14\"/></svg>";

    var totop = "<svg width=\"18\" height=\"10\" viewBox=\"0 0 18 10\" xmlns=\"http://www.w3.org/2000/svg\"><polyline fill=\"none\" stroke=\"#000\" stroke-width=\"1.2\" points=\"1 9 9 1 17 9 \"/></svg>";

    var icons = {
        spinner: spinner,
        totop: totop,
        marker: marker,
        'close-icon': closeIcon,
        'close-large': closeLarge,
        'navbar-toggle-icon': navbarToggleIcon,
        'overlay-icon': overlayIcon,
        'pagination-next': paginationNext,
        'pagination-previous': paginationPrevious,
        'search-icon': searchIcon,
        'search-large': searchLarge,
        'search-navbar': searchNavbar,
        'slidenav-next': slidenavNext,
        'slidenav-next-large': slidenavNextLarge,
        'slidenav-previous': slidenavPrevious,
        'slidenav-previous-large': slidenavPreviousLarge
    };

    var Icon = {

        install: install,

        extends: SVG,

        args: 'icon',

        props: ['icon'],

        data: {
            include: ['focusable']
        },

        isIcon: true,

        beforeConnect: function() {
            addClass(this.$el, 'uk-icon');
        },

        methods: {

            getSvg: function() {

                var icon = getIcon(this.icon);

                if (!icon) {
                    return Promise.reject('Icon not found.');
                }

                return Promise.resolve(icon);
            }

        }

    };

    var IconComponent = {

        args: false,

        extends: Icon,

        data: function (vm) { return ({
            icon: hyphenate(vm.constructor.options.name)
        }); },

        beforeConnect: function() {
            addClass(this.$el, this.$name);
        }

    };
    