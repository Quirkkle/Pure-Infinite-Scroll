import { EventEmitter } from "events";

export enum PureInfiniteScrollEvent {
    ScrolledBottom = 'scrolledBottom',
    ScrolledTop = 'scrolledTop',
}

/**
 * Infinite scroll event emitter.
 * Emits events when the user reaches the bottom or top of the scrollable container.
 */
export class PureInfiniteScroll extends EventEmitter {
    /**
     * The container of the scrollable area.
     */
    private container: HTMLElement;

    /**
     * The container of the content child's.
     */
    private contentContainer: HTMLElement;

    /**
     * The threshold in pixels from the top or bottom of the scrollable area.
     */
    public threshold: number;

    /**
     * The events to be handled.
     */
    public handleEvents: PureInfiniteScrollEvent[];

    /**
     * Object to keep track of the waiting events.
     */
    private isWaitingEvents: { [key in PureInfiniteScrollEvent]: boolean } = {
        [PureInfiniteScrollEvent.ScrolledBottom]: false,
        [PureInfiniteScrollEvent.ScrolledTop]: false,
    };

    /**
     * Object to keep track of the mutation observers.
     */
    private observerEvents: { [key in PureInfiniteScrollEvent]: MutationObserver | null } = {
        [PureInfiniteScrollEvent.ScrolledBottom]: null,
        [PureInfiniteScrollEvent.ScrolledTop]: null,
    };

    /**
     * The previous scroll height of the container.
     */
    private previousScrollHeight: number = 0;

    /**
     * The previous scroll top of the container.
     */
    private previousScrollTop: number = 0;

    /**
     * Constructor.
     * @param container The container of the scrollable area.
     * @param threshold The threshold in pixels from the top or bottom of the scrollable area.
     */
    constructor(container: HTMLElement, contentContainer?: HTMLElement, threshold?: number, handleEvents?: PureInfiniteScrollEvent[]) {
        super();

        this.container = container;
        this.contentContainer = contentContainer ?? container;
        this.threshold = threshold ?? 0;

        // Set the handleEvents property to the provided handleEvents array if it's present,
        // otherwise set it to an array containing both ScrolledBottom and ScrolledTop events.
        // This array is used to keep track of which events the infinite scroll should handle.
        // The infinite scroll will only emit events that are present in this array.
        this.handleEvents = handleEvents ?? [
            PureInfiniteScrollEvent.ScrolledBottom,
            PureInfiniteScrollEvent.ScrolledTop,
        ];

        // Add an event listener to the container to detect when the user scrolls.
        this.container.addEventListener('scroll', this.handleScroll.bind(this));

        // Handle the scroll event to detect the initial state.
        // this.handleScroll();
    }

    /**
     * Checks if the user has scrolled to the bottom of the container.
     * @returns boolean
     */
    get isScrolledBottom(): boolean {
        const { scrollTop, scrollHeight, clientHeight } = this.container;

        return scrollHeight - scrollTop - clientHeight <= this.threshold;
    }

    /**
     * Checks if the user has scrolled to the top of the container.
     * @returns boolean
     */
    get isScrolledTop(): boolean {
        return this.container.scrollTop <= this.threshold;
    }

    /**
     * Handles the scroll event.
     * This method is called whenever the user scrolls in the container.
     * It checks if the user has scrolled to the bottom or top of the container,
     * and if so, emits the corresponding event.
     */
    private handleScroll() {
        // Get the events that need to be emitted
        const events: PureInfiniteScrollEvent[] = [];

        // Check if the user has scrolled to the bottom of the container
        if (this.isScrolledBottom) {
            // Add the event to the list of events that need to be emitted
            events.push(PureInfiniteScrollEvent.ScrolledBottom);
        }

        // Check if the user has scrolled to the top of the container
        if (this.isScrolledTop) {
            // Add the event to the list of events that need to be emitted
            events.push(PureInfiniteScrollEvent.ScrolledTop);
        }

        // Emit the events
        events.forEach((event) => {
            // Emit the event
            this.emitEvent(event);
        });
    }

    /**
     * Emits an event.
     * @param event The event to be emitted.
     *
     * This method does the following:
     * 1. Sets the flag indicating that an event is being processed.
     * 2. Saves the current scroll position from the top of the element.
     * 3. Creates a new MutationObserver to monitor changes in the DOM.
     * 4. Waits for content changes to be finished before emitting the event.
     * 5. Emits the event.
     */
    private emitEvent(event: PureInfiniteScrollEvent) {
        if (// Check if the event is not being processed
            this.isWaitingEvents[event] ||
            // Check if the event is one of the events that need to be handled
            !this.handleEvents.includes(event)
        ) {
            return;
        }

        // Set the flag indicating that an event is being processed
        this.isWaitingEvents[event] = true;

        // Save the current scroll position from the top of the element
        // This is necessary to detect when the content has finished loading
        // and the user has scrolled to the end of the content.
        this.previousScrollHeight = this.container.scrollHeight;
        this.previousScrollTop = this.container.scrollTop;

        // Start detecting content changes
        // This will wait for the content to finish loading and then emit the event.
        this.waitForContentChanges(event);

        // Emit the event
        this.emit(event);
    }

    /**
     * Waits for content changes.
     * @param event The event to be handled.
     */
    private waitForContentChanges(event: PureInfiniteScrollEvent) {
        // Create a new MutationObserver to monitor changes in the DOM
        this.observerEvents[event] = new MutationObserver((mutations) => {
            // Take the first mutation record from the list
            const mutation = mutations[0];

            // Check if the first added node matches the first child of the content container
            const mutationStart = this.contentContainer.firstChild?.isEqualNode(mutation.addedNodes[0]);
            // Check if the last added node matches the last child of the content container
            const mutationEnd = this.contentContainer.lastChild?.isEqualNode(mutation.addedNodes[mutation.addedNodes.length - 1]);

            // If the mutation relates to the top of the container and event is ScrolledTop,
            // or the mutation relates to the bottom and event is ScrolledBottom, proceed
            if ((mutationStart && event === PureInfiniteScrollEvent.ScrolledTop) || (mutationEnd && event === PureInfiniteScrollEvent.ScrolledBottom)) {
                // Stop observing further changes for this event
                this.observerEvents[event]?.disconnect();
                this.observerEvents[event] = null;

                // Mark the event as not waiting anymore
                this.isWaitingEvents[event] = false;

                // Handle the changes in content to adjust the scroll position
                // Save scroll position only on scroll top
                if (event === PureInfiniteScrollEvent.ScrolledTop) {
                    this.handleContentChanges();
                }
            }
        });

        // Start observing the content container for child node additions
        this.observerEvents[event].observe(this.contentContainer, { childList: true });
    }

    /**
     * Handles the content changes.
     */
    private handleContentChanges() {
        // Calculate the new scroll position to retain user view
        const newScrollHeight = this.container.scrollHeight;
        const heightDifference = newScrollHeight - this.previousScrollHeight;

        // Update scroll position to keep the content at the top unchanged for the user
        this.container.scrollTop = this.previousScrollTop + heightDifference;
    }
}


