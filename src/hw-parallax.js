/*
 Copyright (C) 2013 Ziad Saab ziad(dot)saab(at)gmail(dot)com

 Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 documentation files (the "Software"), to deal in the Software without restriction, including without limitation
 the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 permit persons to whom the Software is furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
 WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
 OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
;(function($) {
  var ParallaxManager = function(options) {
    this.options = options;
    this.vendor_prefixes = ['webkit', 'moz', 'o', 'ms'];
    this.num_vendor_prefixes = this.vendor_prefixes.length;

    // Function used to detect support for a certain CSS style
    var thisBrowserSupportsStyle = function(style) {
      var vendors = ['Webkit', 'Moz', 'ms', 'O'];
      var num_vendors = vendors.length;
      var dummy_el = window.document.createElement('parallax');

      // First test the bare style without prefix
      if (dummy_el.style[style] !== undefined) {
        return true;
      }

      // Test the camel-cased vendor-prefixed styles
      style = style.replace(/./, function(first) {return first.toUpperCase();});
      for (var i = 0; i < num_vendors; i++) {
        var pfx_style = vendors[i] + style;
        // The browser will return an empty string if a style is supported but not present, and undefined if the style is not supported
        if (dummy_el.style[pfx_style] !== undefined) {
          return true;
        }
      }
      return false;
    };

    // Detect if we have 2d or 3d transforms by checking for support of the transform (2d) and perspective (3d) styles
    this.has_3dtransforms = thisBrowserSupportsStyle('perspective');
    // Additional test due to false positives returned with WebKit on some browsers: they support perspective but can't do 3d transforms
    if (this.has_3dtransforms && thisBrowserSupportsStyle('WebkitPerspective')) {
      var $test_el = $('<div><style type="text/css">@media (transform-3d),(-webkit-transform-3d) {#parallax-3dtest {position: absolute;left: 9px;height: 5px;margin: 0;padding: 0;border: 0;}</style><div id="parallax-3dtest"></div></div>').appendTo('body');
      var $el = $('#parallax-3dtest');
      this.has_3dtransforms = $el.height() == 5 && $el.offset().left == 9;
      $test_el.remove();
    }
    this.has_2dtransforms = thisBrowserSupportsStyle('transform');
  };

  // Define "methods" on the ParallaxManager class
  $.extend(ParallaxManager.prototype, {
    init: function() {
      this.scroll_factor = this.options.scroll_factor;
      var parallax_blocks = this.parallax_blocks = [];

      var $body = $('body');
      var $origins = this.options.origins;
      $origins.each(function() {
        var $origin = $(this);
        var $parallax_block;
        if ($origin.data('image')) {
          $parallax_block = $('<div class="parallax-block"><img class="parallax-image" src="' + $origin.data('image') + '"></div>');
          parallax_blocks.push({
            origin: $origin,
            block: $parallax_block,
            bg_ratio: $origin.data('width') / $origin.data('height')
          });
          $body.prepend($parallax_block);
        }
        else if ($origin.data('tile')) {
          $parallax_block = $('<div class="parallax-block"><div class="parallax-image" style="background-image: url(' + $origin.data('tile') + ')"></div></div>')
          parallax_blocks.push({
            origin: $origin,
            block: $parallax_block,
            bg_ratio: 1
          });
          $body.prepend($parallax_block);
        }
      });

      var manager = this;
      var reconfigure = function() {
        manager.redrawBlocks();
        manager.render();
      };
      var $window = $(window);
      $window.on('load', reconfigure);
      $window.on('resize', reconfigure);
      $window.on('scroll', function() {manager.render();});
    },
    redrawBlocks: function() {
      var window_width = $(window).width();
      var window_height = this.window_height = $(window).height();

      // Calculate document height to fix Chrome issue when scrolling past the content...
      var body = document.body;
      var html = document.documentElement;

      var document_height = Math.max( body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
      this.max_scrolltop = Math.max(0, document_height - window_height);

      var num_parallax_blocks = this.parallax_blocks.length;
      for (var i = 0; i < num_parallax_blocks; i++) {
        var parallax_block_data = this.parallax_blocks[i];
        var $parallax_block = parallax_block_data.block;
        var bg_ratio = parallax_block_data.bg_ratio;
        var $parallax_image = $parallax_block.children('.parallax-image');
        var $origin = parallax_block_data.origin;

        // Calculate the minimum background image height so that we may scroll by the scroll factor and keep the image in the bounds of its container
        var origin_height = $origin.outerHeight();
        var min_height = window_height - ((window_height - origin_height) * this.scroll_factor);

        // Calculate the size of the parallax background image so that it covers the target block while still respecting the previously calculated minimum height
        // Also, if the image's width is larger than the window's, center it about its parent element
        var img_width = window_width;
        var img_height = Math.ceil(img_width / bg_ratio);
        var img_xoff = 0;
        if (img_height < min_height) {
          img_height = min_height;
          img_width = img_height * bg_ratio;
          img_xoff = Math.floor(img_width - window_width) / 2;
        }
        $parallax_image.width(img_width).height(img_height);

        // Set the dimensions of the parallax block and hide it
        $parallax_block.width(window_width).height(origin_height).css('visibility', 'hidden');

        // Cache some data about the parallax block so that we don't have to recalculate it on every tick
        // This data potentially changes, only changes when the window is resized
        $.extend(parallax_block_data, {
          origin_position: $origin.offset().top,
          origin_height: origin_height,
          image: $parallax_image,
          image_xoff: img_xoff,
          image_height: img_height
        });
      }
    },
    render: function() {
      if (!this.drawing) {
        this.drawing = true;
        var manager = this;
        if (window.requestAnimationFrame) {
          window.requestAnimationFrame(function() {manager.draw();}, document);
        }
        else {
          manager.draw();
        }
      }
    },
    draw: function() {
      var scroll_top = Math.min(Math.max(0, $(window).scrollTop()), this.max_scrolltop);

      // Loop thru all the parallax blocks
      var num_blocks = this.parallax_blocks.length;
      var data;
      for (var i = 0; i < num_blocks; i++) {
        data = this.parallax_blocks[i];
        // Determine if parallax block is in view
        // i.e. its bottom is below the window's upper bound and its top is above the window's lower bound
        if (data.origin_position < scroll_top + this.window_height && data.origin_position + data.origin_height > scroll_top) {
          // The block's y position in its fixed plane is the position of the original block relative to the top of the window
          var new_block_position = data.origin_position - scroll_top;
          // The background image's position is parallaxed to follow the block by the scroll factor
          var new_image_position = new_block_position * (this.scroll_factor - 1);

          // Apply the translations to block and image using the best method possible: 3d transform, 2d transform or regular top/left
          var block_styles = {
            visibility: 'visible'
          };
          var image_styles = {};
          var block_transform, image_transform, prefixed_style;
          var j;
          if (this.has_3dtransforms) {
            block_transform = block_styles.transform = 'translate3d(0px, ' + new_block_position + 'px, 0px)';
            image_transform = image_styles.transform = 'translate3d(-' + data.image_xoff + 'px, ' + new_image_position + 'px, 0px)';
            for (j = 0; j < this.num_vendor_prefixes; j++) {
              prefixed_style = '-' + this.vendor_prefixes[j] + '-transform';
              block_styles[prefixed_style] = block_transform;
              image_styles[prefixed_style] = image_transform;
            }
          }
          else if (this.has_2dtransforms) {
            block_transform = block_styles.transform = 'translate(0px, ' + new_block_position + 'px)';
            image_transform = image_styles.transform = 'translate(-' + data.image_xoff + 'px, ' + new_image_position + 'px)';
            for (j = 0; j < this.num_vendor_prefixes; j++) {
              prefixed_style = '-' + this.vendor_prefixes[j] + '-transform';
              block_styles[prefixed_style] = block_transform;
              image_styles[prefixed_style] = image_transform;
            }
          }
          else {
            block_styles.top = new_block_position + 'px';
            block_styles.left = 0 + 'px';
            image_styles.top = new_image_position + 'px';
            image_styles.left = -data.image_xoff + 'px';
          }
          data.block.css(block_styles);
          data.image.css(image_styles);
        }
        else {
          data.block.css('visibility', 'hidden');
        }
      }
      this.drawing = false;
    }
  });

  // Hook into jQuery
  $.extend($.fn, {
    parallax: function(options) {
      var settings = $.extend(
          {
            scroll_factor: 0.2
          },
          options,
          {
            origins: $(this)
          }
      );
      var pm = new ParallaxManager(settings);
      pm.init();
    }
  });
})(jQuery);