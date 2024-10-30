# 🚀 Pure Infinite Scroll

Crafted in TypeScript and designed for pure JavaScript, this lightweight library was born from the frustration of complex, unreliable alternatives.  
With only a single dependency on `events` it delivers flawless, plug-and-play infinite scrolling—no frameworks, no fuss, just effortless scrolling. ✨

---

## 📦 Installation

Install via npm:

```bash
npm i pure-infinite-scroll
```

Or download the file manually:

- [pure-infinite-scroll.umd.cjs](https://unpkg.com/pure-infinite-scroll@1/dist/pure-infinite-scroll.umd.cjs)

To include it directly in HTML:

```html
<script src="pure-infinite-scroll.umd.cjs"></script>
```

Or use CDN:

```html
<script src="https://unpkg.com/pure-infinite-scroll@1/dist/pure-infinite-scroll.umd.cjs"></script>
```

---

## 🚀 Basic Usage

1. Create a scrollable container in HTML:

    ```html
    <div id="wrapper">
        <div></div>
        <div></div>
        <div></div>
    </div>
    ```

2. Set up infinite scroll in JavaScript:

    ```javascript
    // Reference the scrollable container
    const wrapper = document.getElementById('wrapper');

    // Initialize Pure Infinite Scroll
    const infiniteScroll = new PureInfiniteScroll(wrapper);

    // Listen for the "scrolledBottom" event
    infiniteScroll.on('scrolledBottom', () => {
        // Fetch and append additional content
    });
    ```

---

### ⚙️ Advanced Usage with TypeScript

For a more customized setup, you can pass additional parameters:

```html
<div id="wrapper">
    <div id="element">
        <div></div>
        <div></div>
        <div></div>
    </div>
</div>
```

```typescript
const wrapperElement = document.getElementById('wrapper');
const element = document.getElementById('element'); // Optional, if wrapper contains content directly

const infiniteScroll = new PureInfiniteScroll(
    wrapperElement,
    element,
    50, // Event trigger threshold
    [InfiniteScrollEvent.ScrolledTop] // Event list to handle
);

infiniteScroll.on(InfiniteScrollEvent.ScrolledTop, () => {
    // Handle the scroll event at the top
});
```

For a full example, check out [`./example/index.html`](./example/index.html). Clone the repo and open this file in your browser.

---

## 🌐 Browser Support

| Supported Browsers      | Minimum Version |
|-------------------------|-----------------|
| Chrome                  | 26+            |
| Firefox                 | 14+            |
| Safari                  | 6.1+           |
| Edge                    | 12+            |
| Internet Explorer       | ❌ Not supported |

---

## 🛠 Development

To build the project:

```bash
npm build
```

To run tests:

```bash
npm test
```
