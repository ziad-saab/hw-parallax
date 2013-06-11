hw-parallax
===========
Hardware-accelerated scrolling parallax plugin for jQuery
-------------------------------------------------------------------
The smooth parallax scrolling effect is achieved by using CSS 3D transforms where available. The system falls back to
2D transforms or even regular `top` and `left` positioning on older browsers.

**TODO**: make it work on touch scroll devices using [iScroll 4](http://cubiq.org/iscroll-4)

### Basic usage
* Include `parallax.min.css` from the `dist` directory in the `<head>` of your page
* Include `parallax.min.js` from the `dist` directory at the bottom of your HTML, after jQuery
* For regular background images, use the following markup:

        <div data-image="image_source_relative_to_page" data-width="image_width_in_pixels" data-height="image_height_in_pixels">

* For tiled background images, use the following markup:

        <div data-tile="tiled_image_source_relative_to_page">

* If the blocks are just used for parallax effect and don't have any content, give them a specific height in whatever unit you want
* If the blocks are to have content, include the content as you would normally. The plugin will create separate blocks for the parallax effect, `z-index`ed at `-1`
* Add any common class you want to all your parallax blocks (e.g. `class="parallax"`)
* Use `$('.parallax').parallax()` to create the effect

Check the `demo` directory or the [demo page](http://hw-parallax.ziad.cc/) for a complete example using both tiled and regular backgrounds.

### Sites using this plugin
* [I Can Go Without](http://www.icangowithout.com)
* [Brendan Sera-Shriar a.k.a. digibomb](http://brendanserashriar.com/)
* [Pinot Gris, 2012 Monterey by La Crema](http://pg.lacrema.com/)
