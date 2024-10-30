import { PureInfiniteScroll, PureInfiniteScrollEvent } from "../src/infinite-scroll";
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('InfiniteScroll', () => {
    let container: HTMLElement;
    let contentContainer: HTMLElement;
    let infiniteScroll: PureInfiniteScroll;

    beforeEach(() => {
        container = document.createElement('div');

        contentContainer = document.createElement('div');

        container.appendChild(contentContainer);
        document.body.appendChild(container);

        Object.defineProperty(container, 'clientHeight', { value: 200 });

        Object.defineProperty(container, 'scrollHeight', {
            writable: true,
            value: 1000,
        });

        infiniteScroll = new PureInfiniteScroll(container, contentContainer, 50);
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    describe('isScrolledBottom', () => {
        it('should return true if scrolled near bottom', () => {
            container.scrollTop = container.scrollHeight - container.clientHeight - 10;

            expect(infiniteScroll.isScrolledBottom).toBe(true);
        });

        it('should return false if not scrolled near bottom', () => {
            container.scrollTop = 100;

            expect(infiniteScroll.isScrolledBottom).toBe(false);
        });
    });

    describe('isScrolledTop', () => {
        it('should return true if scrolled near top', () => {
            container.scrollTop = 10;
            expect(infiniteScroll.isScrolledTop).toBe(true);
        });

        it('should return false if not scrolled near top', () => {
            container.scrollTop = 100;
            expect(infiniteScroll.isScrolledTop).toBe(false);
        });
    });

    describe('handleScroll', () => {
        it('should emit "scrolledBottom" if scrolled to bottom', async () => {
            // Create a promise that resolves when the event is emitted
            const scrolledBottomPromise = new Promise<void>((resolve) => {
                infiniteScroll.on(PureInfiniteScrollEvent.ScrolledBottom, () => {
                    resolve(); // Resolve the promise when the event is emitted
                });
            });

            container.scrollTop = container.scrollHeight - container.clientHeight;
            infiniteScroll['handleScroll']();

            // Wait for the promise to resolve
            await scrolledBottomPromise;
        });

        it('should emit "scrolledTop" if scrolled to top', async () => {
            // Create a promise that resolves when the event is emitted
            const scrolledTopPromise = new Promise<void>((resolve) => {
                infiniteScroll.on(PureInfiniteScrollEvent.ScrolledTop, () => {
                    resolve(); // Resolve the promise when the event is emitted
                });
            });

            container.scrollTop = 0;
            infiniteScroll['handleScroll']();

            await scrolledTopPromise;
        });
    });

    describe('emitEvent', () => {
        it('should set isWaitingEvents for an emitted event', () => {
            infiniteScroll['emitEvent'](PureInfiniteScrollEvent.ScrolledBottom);
            expect(infiniteScroll['isWaitingEvents'][PureInfiniteScrollEvent.ScrolledBottom]).toBe(true);
        });

        it('should create a MutationObserver for an event', () => {
            infiniteScroll['emitEvent'](PureInfiniteScrollEvent.ScrolledBottom);
            expect(infiniteScroll['observerEvents'][PureInfiniteScrollEvent.ScrolledBottom]).not.toBeNull();
        });
    });

    describe('waitForContentChanges', () => {
        it('should stop observing once content change is detected', async () => {
            infiniteScroll['waitForContentChanges'](PureInfiniteScrollEvent.ScrolledBottom);

            // Simulate content addition at bottom
            const newNode = document.createElement('div');
            contentContainer.appendChild(newNode);

            await new Promise<void>((resolve) => {
                setTimeout(() => {
                    expect(infiniteScroll['isWaitingEvents'][PureInfiniteScrollEvent.ScrolledBottom]).toBe(false);
                    resolve();
                }, 50);
            });
        });
    });

    describe('handleContentChanges', () => {
        it('should adjust scrollTop based on content change', () => {
            container.scrollTop = 100;
            infiniteScroll['previousScrollTop'] = 100;
            infiniteScroll['previousScrollHeight'] = container.scrollHeight;

            contentContainer.style.height = '1200px';

            infiniteScroll['handleContentChanges']();

            const newScrollTop = 100 + (container.scrollHeight - infiniteScroll['previousScrollHeight']);
            expect(container.scrollTop).toBe(newScrollTop);
        });
    });

    describe('Event Handling', () => {
        it('should not emit events when not enabled in handleEvents', () => {
            const customScroll = new PureInfiniteScroll(container, contentContainer, 50, [PureInfiniteScrollEvent.ScrolledTop]);

            const bottomSpy = vi.fn();
            customScroll.on(PureInfiniteScrollEvent.ScrolledBottom, bottomSpy);

            container.scrollTop = container.scrollHeight - container.clientHeight;
            customScroll['handleScroll']();

            expect(bottomSpy).not.toHaveBeenCalled();
        });

        it('should emit "scrolledBottom" only once until event is reset', () => {
            const bottomSpy = vi.fn();
            infiniteScroll.on(PureInfiniteScrollEvent.ScrolledBottom, bottomSpy);

            container.scrollTop = container.scrollHeight - container.clientHeight;
            infiniteScroll['handleScroll']();
            infiniteScroll['handleScroll']();

            expect(bottomSpy).toHaveBeenCalledTimes(1);

            infiniteScroll['isWaitingEvents'][PureInfiniteScrollEvent.ScrolledBottom] = false;
            infiniteScroll['handleScroll']();
            expect(bottomSpy).toHaveBeenCalledTimes(2);
        });
    });

    describe('isScrolledBottom and isScrolledTop Edge Cases', () => {
        it('should handle very small scroll thresholds accurately', () => {
            infiniteScroll = new PureInfiniteScroll(container, contentContainer, 1);

            container.scrollTop = container.scrollHeight - container.clientHeight - 1;
            expect(infiniteScroll.isScrolledBottom).toBe(true);

            container.scrollTop = 1;
            expect(infiniteScroll.isScrolledTop).toBe(true);
        });

        it('should handle thresholds larger than container height gracefully', () => {
            infiniteScroll = new PureInfiniteScroll(container, contentContainer, 500);

            container.scrollTop = container.scrollHeight - container.clientHeight;
            expect(infiniteScroll.isScrolledBottom).toBe(true);

            container.scrollTop = 0;
            expect(infiniteScroll.isScrolledTop).toBe(true);
        });
    });

    describe('emitEvent and MutationObserver Interaction', () => {
        it('should not emit events if MutationObserver is active', async () => {
            infiniteScroll['emitEvent'](PureInfiniteScrollEvent.ScrolledBottom);

            const bottomSpy = vi.fn();
            infiniteScroll.on(PureInfiniteScrollEvent.ScrolledBottom, bottomSpy);

            infiniteScroll['emitEvent'](PureInfiniteScrollEvent.ScrolledBottom);

            await new Promise<void>((resolve) => {
                setTimeout(() => {
                    expect(bottomSpy).not.toHaveBeenCalled();
                    infiniteScroll['isWaitingEvents'][PureInfiniteScrollEvent.ScrolledBottom] = false;
                    resolve();
                }, 50);
            });
        });

        it('should disconnect MutationObserver after content change is detected', async () => {
            infiniteScroll['emitEvent'](PureInfiniteScrollEvent.ScrolledBottom);
            expect(infiniteScroll['observerEvents'][PureInfiniteScrollEvent.ScrolledBottom]).not.toBeNull();

            const newNode = document.createElement('div');
            contentContainer.appendChild(newNode);

            await new Promise<void>((resolve) => {
                setTimeout(() => {
                    expect(infiniteScroll['observerEvents'][PureInfiniteScrollEvent.ScrolledBottom]).toBeNull();
                    resolve();
                }, 50);
            });
        });
    });

    describe('Content Adjustment on Change', () => {
        it('should keep scroll position steady when new content is added at top', () => {
            container.scrollTop = 200;
            infiniteScroll['previousScrollTop'] = 200;
            infiniteScroll['previousScrollHeight'] = container.scrollHeight;

            const newTopContent = document.createElement('div');
            newTopContent.style.height = '100px';
            contentContainer.insertBefore(newTopContent, contentContainer.firstChild);
            infiniteScroll['handleContentChanges']();

            const newScrollTop = infiniteScroll['previousScrollTop'] + (container.scrollHeight - infiniteScroll['previousScrollHeight']);
            expect(container.scrollTop).toBe(newScrollTop);
        });

        it('should adjust scroll position based on content added at bottom', () => {
            container.scrollTop = container.scrollHeight - container.clientHeight;
            infiniteScroll['previousScrollHeight'] = container.scrollHeight;

            const newBottomContent = document.createElement('div');
            newBottomContent.style.height = '100px';
            contentContainer.appendChild(newBottomContent);

            infiniteScroll['handleContentChanges']();
            expect(container.scrollTop).toBe(infiniteScroll['previousScrollTop']);
        });
    });

    describe('Realistic User Scenarios', () => {
        it('should handle continuous scrolling down smoothly', async () => {
            const bottomSpy = vi.fn();
            infiniteScroll.on(PureInfiniteScrollEvent.ScrolledBottom, bottomSpy);

            await new Promise<void>((resolve) => {
                const interval = setInterval(() => {
                    container.scrollTop += 10;
                    infiniteScroll['handleScroll']();

                    if (container.scrollTop >= container.scrollHeight - container.clientHeight) {
                        clearInterval(interval);
                        expect(bottomSpy).toHaveBeenCalled();
                        resolve();
                    }
                }, 10);
            });
        });

        it('should handle rapid scroll events without emitting duplicates', () => {
            const bottomSpy = vi.fn();
            infiniteScroll.on(PureInfiniteScrollEvent.ScrolledBottom, bottomSpy);

            for (let i = 0; i < 10; i++) {
                container.scrollTop = container.scrollHeight - container.clientHeight;
                infiniteScroll['handleScroll']();
            }

            expect(bottomSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('Race Conditions and Performance', () => {
        it('should not emit "scrolledBottom" multiple times during rapid scroll changes', () => {
            const bottomSpy = vi.fn();
            infiniteScroll.on(PureInfiniteScrollEvent.ScrolledBottom, bottomSpy);

            container.scrollTop = container.scrollHeight - container.clientHeight;
            for (let i = 0; i < 10; i++) {
                infiniteScroll['handleScroll']();
            }

            expect(bottomSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('Dynamic Content Changes', () => {
        it('should handle content being removed from top without affecting scroll position', () => {
            container.scrollTop = 100;
            infiniteScroll['previousScrollTop'] = 100;
            infiniteScroll['previousScrollHeight'] = container.scrollHeight;

            const topContent = document.createElement('div');
            topContent.style.height = '100px';
            contentContainer.insertBefore(topContent, contentContainer.firstChild);

            contentContainer.removeChild(topContent);
            infiniteScroll['handleContentChanges']();

            expect(container.scrollTop).toBe(100);
        });

        it('should continue to detect bottom scroll after dynamic content update', async () => {
            const bottomSpy = vi.fn();
            infiniteScroll.on(PureInfiniteScrollEvent.ScrolledBottom, bottomSpy);

            container.scrollTop = container.scrollHeight - container.clientHeight;
            infiniteScroll['handleScroll']();

            const newContent = document.createElement('div');
            newContent.style.height = '200px';
            contentContainer.appendChild(newContent);

            Object.defineProperty(container, 'scrollHeight', {
                writable: true,
                value: container.scrollHeight + 200,
            });

            await new Promise<void>((resolve) => {
                setTimeout(() => {
                    container.scrollTop = container.scrollHeight - container.clientHeight;
                    infiniteScroll['handleScroll']();

                    expect(bottomSpy).toHaveBeenCalledTimes(2);
                    resolve();
                }, 50);
            });
        });
    });

    describe('Scroll Top Edge Case Scenarios', () => {
        it('should emit "scrolledTop" only when threshold is genuinely crossed', () => {
            infiniteScroll = new PureInfiniteScroll(container, contentContainer, 0);

            const topSpy = vi.fn();
            infiniteScroll.on(PureInfiniteScrollEvent.ScrolledTop, topSpy);

            container.scrollTop = 1;
            infiniteScroll['handleScroll']();
            expect(topSpy).not.toHaveBeenCalled();

            container.scrollTop = 0;
            infiniteScroll['handleScroll']();
            expect(topSpy).toHaveBeenCalledTimes(1);
        });

        it('should prevent multiple "scrolledTop" events when threshold is only partially crossed', () => {
            infiniteScroll = new PureInfiniteScroll(container, contentContainer, 0);

            const topSpy = vi.fn();
            infiniteScroll.on(PureInfiniteScrollEvent.ScrolledTop, topSpy);

            container.scrollTop = 2;
            infiniteScroll['handleScroll']();
            expect(topSpy).not.toHaveBeenCalled();

            container.scrollTop = 0;
            infiniteScroll['handleScroll']();
            container.scrollTop = 1;
            infiniteScroll['handleScroll']();
            container.scrollTop = 0;
            infiniteScroll['handleScroll']();

            expect(topSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('Observer Resilience', () => {
        it('should handle multiple observers gracefully without memory leaks', async () => {
            const topSpy = vi.fn();
            infiniteScroll.on(PureInfiniteScrollEvent.ScrolledTop, topSpy);

            for (let i = 0; i < 5; i++) {
                infiniteScroll['emitEvent'](PureInfiniteScrollEvent.ScrolledTop);
            }

            await new Promise<void>((resolve) => {
                setTimeout(() => {
                    expect(topSpy).toHaveBeenCalledTimes(1);
                    resolve();
                }, 100);
            });
        });

        it('should stop observer when content changes and doesn’t fire extra events', async () => {
            const bottomSpy = vi.fn();
            infiniteScroll.on(PureInfiniteScrollEvent.ScrolledBottom, bottomSpy);

            infiniteScroll['emitEvent'](PureInfiniteScrollEvent.ScrolledBottom);
            contentContainer.appendChild(document.createElement('div'));

            await new Promise<void>((resolve) => {
                setTimeout(() => {
                    expect(bottomSpy).toHaveBeenCalledTimes(1);
                    resolve();
                }, 100);
            });
        });
    });

    describe('Stress Testing Scroll Event Handling', () => {
        it('should handle continuous scrolling up and down without duplicate events', async (done) => {
            const topSpy = vi.fn();
            const bottomSpy = vi.fn();
            infiniteScroll.on(PureInfiniteScrollEvent.ScrolledTop, topSpy);
            infiniteScroll.on(PureInfiniteScrollEvent.ScrolledBottom, bottomSpy);

            const interval = setInterval(() => {
                container.scrollTop = container.scrollTop === 0
                    ? container.scrollHeight - container.clientHeight
                    : 0;
                infiniteScroll['handleScroll']();
            }, 5);

            await new Promise<void>((resolve) => {
                setTimeout(() => {
                    clearInterval(interval);
                    expect(topSpy).toHaveBeenCalledTimes(1);
                    expect(bottomSpy).toHaveBeenCalledTimes(1);
                    resolve();
                }, 200);
            });
        });
    });
});
