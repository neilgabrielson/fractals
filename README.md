# Fractal Plotter

An interactive fractal visualization tool that demonstrates the relationship between the Mandelbrot set and Julia sets. **[Try it live here!](https://neilgabrielson.com/fractals/)**

## Overview

This tool features side-by-side windows showing how the Mandelbrot set parameterizes Julia sets. Watch as Julia sets continuously deform as you explore the parameter space, and see individual points iterate, either escaping to infinity or settling into cycles.

## Features

### Fractal Types
- **Mandelbrot Set**
- **Cubic Multibrot**
- **Quartic Multibrot**
- **Hyperbolic Mandelbrot**
- **Burning Ship**

### Interactive Controls

**Navigation:**
- Click on the Mandelbrot set (left) to set the Julia set parameter `c`
- Click on the Julia set (right) to set the starting point `z`
- Zoom in/out with `+`/`-` buttons or scroll gestures
- Reset views with individual Reset buttons

**Parameter Control:**
- Lock/Unlock cursor mode - when unlocked, moving your mouse over the Mandelbrot set continuously updates the Julia set
- Manual parameter entry for precise `c` and `z` values
- Adjustable escape radius iterations (10-1000)

**Iterarions:**
- Single iteration step with "Iterate" button
- Automatic iteration with Play/Pause controls
- Adjustable iteration speed (10-1000ms intervals)

### Three Colormaps to Choose From:
- **Dark Red**
- **Aqua**
- **Viridis**

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `z`/`x` | Zoom in/out (Mandelbrot/parameter space) |
| `q`/`w` | Zoom in/out (Julia/phase space) |
| `i` | Single iteration step |
| `p` | Play/pause continuous iteration |
| `l` | Toggle cursor lock |
| `r` | Full reset |

## Mathematical Background

The Mandelbrot set is generated by iterating complex functions of the form `f(z) = z^n + c` and testing for escape from a bounded region. The set consists of all complex parameters `c` for which the orbit of `z = 0` remains bounded. Each point in the Mandelbrot set corresponds to a unique Julia set with that parameter value.

### Fractal Equations

- **Mandelbrot**: `f(z) = z² + c`
- **Cubic Multibrot**: `f(z) = z³ + c` 
- **Quartic Multibrot**: `f(z) = z⁴ + c`
- **Hyperbolic Mandebrot**: `f(z) = z² + c` (with Hyperbolic/Split-Complex Numbers)
- **Burning Ship**: `f(z) = (|Re(z)| + i|Im(z)|)² + c` (Just like the Mandelbrot, but you take the absolute values of the real and imaginary parts for each iteration)

## Usage Tips

1. **Exploring**: Unlock your cursor and pan around the mandelbrot set to see the Julia sets continuously deform!
2. **Zooming**: Use the keyboard shortcuts or control panel buttons to adjust the window!
3. **Iterations**: Watch points in the Julia set either escape or approach a cycle by iterating on them repeatedly or playing automatic iterations!
4. **Performance**: Adjust iteration count or the escape criterion to speed up rendering while exploring or increase detail when zoomed in!

## Technical Details

- **Resolution**: 400×400 pixels per canvas
- **Real-time rendering** using HTML5 Canvas and JavaScript
- **Responsive controls** with smooth mouse interaction
- **Mobile-friendly** with gesture support for zoom

## Files

- `index.html` - Main interface and layout
- `script.js` - Fractal mathematics and interaction logic
- `style.css` - Visual styling and layout
- `README.md` - This documentation

## Getting Started
1. Clone this repository
2. Open `index.html` in a web browser  
3. Start exploring fractals!

No build process or dependencies required - it's pure HTML, CSS, and JavaScript

## Links

- **[Live Demo](https://neilgabrielson.com/fractals/)**
- **[GitHub Repository](https://github.com/neilgabrielson/fractals)**
- **[Neil Gabrielson's Website](https://neilgabrielson.com)**
