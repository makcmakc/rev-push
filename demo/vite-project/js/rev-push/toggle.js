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