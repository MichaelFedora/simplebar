import { scrollbarWidth } from './scrollbar-width'

const IS_WEBKIT = 'WebkitAppearance' in document.documentElement.style

const hasClass = function(el, className) {
    if (el.classList)
        return el.classList.contains(className)
    else
        return new RegExp('(^| )' + className + '( |$)', 'gi').test(el.className)
}

export default class SimpleBar {
    constructor(element, options) {
        this.el = element,
        this.track,
        this.scrollbar,
        this.dragOffset,
        this.flashTimeout,
        this.contentEl          = this.el,
        this.scrollContentEl    = this.el,
        this.scrollDirection    = 'vert',
        this.scrollOffsetAttr   = 'scrollTop',
        this.sizeAttr           = 'height',
        this.scrollSizeAttr     = 'scrollHeight',
        this.offsetAttr         = 'top'

        const DEFAULTS = {
            wrapContent: true,
            autoHide: true,
            css: {
                container: 'simplebar',
                content: 'simplebar-content',
                scrollContent: 'simplebar-scroll-content',
                scrollbar: 'simplebar-scrollbar',
                scrollbarTrack: 'simplebar-track'
            }
        }

        this.options = Object.assign({}, DEFAULTS, options)
        this.theme   = this.options.css

        this.init()
    }

    init() {
        // If scrollbar is a floating scrollbar, disable the plugin
        if(scrollbarWidth() === 0) {
            this.el.style.overflow = 'auto'

            return
        }

        if (hasClass(this.el, this.theme.container + ' horizontal')) {
            this.scrollDirection    = 'horiz'
            this.scrollOffsetAttr   = 'scrollLeft'
            this.sizeAttr           = 'width'
            this.scrollSizeAttr     = 'scrollWidth'
            this.offsetAttr         = 'left'
        }

        if (this.options.wrapContent) {
            const wrapperScrollContent = document.createElement('div')
            while (this.el.firstChild)
                wrapperScrollContent.append(this.el.firstChild)
            this.el.append(wrapperScrollContent)
            wrapperScrollContent.classList.add(this.theme.scrollContent)

            const wrapperContent = document.createElement('div')
            wrapperContent.classList.add(this.theme.content)
        }

        this.contentEl = this.$el.find('.' + this.theme.content)

        this.$el.prepend('<div class="' + this.theme.scrollbarTrack + '"><div class="' + this.theme.scrollbar + '"></div></div>')
        this.$track = this.$el.find('.' + this.theme.scrollbarTrack)
        this.$scrollbar = this.$el.find('.' + this.theme.scrollbar)

        this.$scrollContentEl = this.$el.find('.' + this.theme.scrollContent)

        this.resizeScrollContent()

        if (this.options.autoHide) {
            this.$el.on('mouseenter', this.flashScrollbar.bind(this))
        }

        this.$scrollbar.on('mousedown', this.startDrag.bind(this))
        this.$scrollContentEl.on('scroll', this.startScroll.bind(this))

        this.resizeScrollbar()

        if (!this.options.autoHide) {
            this.showScrollbar()
        }
    }
    
    /**
     * Start scrollbar handle drag
     */
    startDrag(e) {
        // Preventing the event's default action stops text being
        // selectable during the drag.
        e.preventDefault()

        // Measure how far the user's mouse is from the top of the scrollbar drag handle.
        var eventOffset = e.pageY
        if (this.scrollDirection === 'horiz') {
            eventOffset = e.pageX
        }
        this.dragOffset = eventOffset - this.$scrollbar.offset()[this.offsetAttr]

        $(document).on('mousemove', this.drag.bind(this))
        $(document).on('mouseup', this.endDrag.bind(this))
    }


    /**
     * Drag scrollbar handle
     */
    drag(e) {
        e.preventDefault()

        // Calculate how far the user's mouse is from the top/left of the scrollbar (minus the dragOffset).
        var eventOffset = e.pageY,
            dragPos     = null,
            dragPerc    = null,
            scrollPos   = null

        if (this.scrollDirection === 'horiz') {
          eventOffset = e.pageX
        }

        dragPos = eventOffset - this.$track.offset()[this.offsetAttr] - this.dragOffset
        // Convert the mouse position into a percentage of the scrollbar height/width.
        dragPerc = dragPos / this.$track[this.sizeAttr]()
        // Scroll the content by the same percentage.
        scrollPos = dragPerc * this.$contentEl[0][this.scrollSizeAttr]

        this.$scrollContentEl[this.scrollOffsetAttr](scrollPos)
    }


    /**
     * End scroll handle drag
     */
    endDrag() {
        $(document).off('mousemove', this.drag)
        $(document).off('mouseup', this.endDrag)
    }


    /**
     * Resize scrollbar
     */
    resizeScrollbar() {
        if(scrollbarWidth === 0) {
            return
        }

        var contentSize     = this.$contentEl[0][this.scrollSizeAttr],
            scrollOffset    = this.$scrollContentEl[this.scrollOffsetAttr](), // Either scrollTop() or scrollLeft().
            scrollbarSize   = this.$track[this.sizeAttr](),
            scrollbarRatio  = scrollbarSize / contentSize,
            // Calculate new height/position of drag handle.
            // Offset of 2px allows for a small top/bottom or left/right margin around handle.
            handleOffset    = Math.round(scrollbarRatio * scrollOffset) + 2,
            handleSize      = Math.floor(scrollbarRatio * (scrollbarSize - 2)) - 2


        if (scrollbarSize < contentSize) {
            if (this.scrollDirection === 'vert'){
                this.$scrollbar.css({'top': handleOffset, 'height': handleSize})
            } else {
                this.$scrollbar.css({'left': handleOffset, 'width': handleSize})
            }
            this.$track.show()
        } else {
            this.$track.hide()
        }
    }


    /**
     * On scroll event handling
     */
    startScroll(e) {
        // Simulate event bubbling to root element
        this.$el.trigger(e)

        this.flashScrollbar()
    }


    /**
     * Flash scrollbar visibility
     */
    flashScrollbar() {
        this.resizeScrollbar()
        this.showScrollbar()
    }


    /**
     * Show scrollbar
     */
    showScrollbar() {
        this.$scrollbar.addClass('visible')

        if (!this.options.autoHide) {
            return
        }
        if(typeof this.flashTimeout === 'number') {
            window.clearTimeout(this.flashTimeout)
        }

        this.flashTimeout = window.setTimeout(this.hideScrollbar.bind(this), 1000)
    }


    /**
     * Hide Scrollbar
     */
    hideScrollbar() {
        this.$scrollbar.removeClass('visible')
        if(typeof this.flashTimeout === 'number') {
            window.clearTimeout(this.flashTimeout)
        }
    }


    /**
     * Resize content element
     */
    resizeScrollContent() {
        if (IS_WEBKIT) {
            return
        }

        if (this.scrollDirection === 'vert'){
            this.$scrollContentEl.width(this.$el.width() + scrollbarWidth)
            this.$scrollContentEl.height(this.$el.height())
        } else {
            this.$scrollContentEl.width(this.$el.width())
            this.$scrollContentEl.height(this.$el.height() + scrollbarWidth)
        }
    }


    /**
     * Recalculate scrollbar
     */
    recalculate() {
        this.resizeScrollContent()
        this.resizeScrollbar()
    }


    /**
     * Getter for original scrolling element
     */
    getScrollElement() {
        return this.scrollContentEl
    }


    /**
     * Getter for content element
     */
    getContentElement() {
        return this.contentEl
    }
}