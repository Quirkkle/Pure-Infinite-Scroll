import { PureInfiniteScroll, PureInfiniteScrollEvent } from "./src/infinite-scroll";

// Check if `window` is defined (to ensure compatibility in various environments)
if (typeof window !== 'undefined') {
    window.PureInfiniteScroll = PureInfiniteScroll;
}

export { PureInfiniteScroll, PureInfiniteScrollEvent };
