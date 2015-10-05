/*
Copyright (C) 2014 Nicholas Bollweg

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

;Reveal.SvgFragment = (function(Reveal){
  "use strict";
  var window = this,
    document = window.document,
    proto = window.location.protocol,
    local = proto === "file:",
    d3 = window.d3,
    defaults = {
      d3: (local ? "http:" : proto) + "//cdn.jsdelivr.net/d3js/latest/d3.min.js",
      selector: "title"
    };

  // the main function, to be called when d3 is available
  function api(){
    d3 = d3 || window.d3;
    var container = d3.selectAll("[data-svg-fragment]"),
      slides = d3.select(".slides");
      
    container.data(function(){
      return container[0].map(function(d){
        var $ = d3.select(d);
        return {
          container: $,
          url: $.attr("data-svg-fragment")
        };
      });
    });

    container.append("iframe")
      .attr({
        src: function(item){ return item.url; },
        // TODO: make this an option?
        scrolling: "no"
      })
      .on("load", api.iframed);

    Reveal.addEventListener("fragmentshown", api.listen(container, true));
    Reveal.addEventListener("fragmenthidden", api.listen(container));

    return api;
  };


  // generate listeners for reveal events
  api.listen = function(container, show){
    return function(event){
      var fragment = d3.select(event.fragment);
      container.filter(function(){
        return this === event.fragment.parentNode;
      }).each(function(item){
        api.toggle(fragment, item, show);
      });

      return api;
    };
  };


  // toggle a fragment
  // TODO: add hide
  api.toggle = function(fragment, item, show){
    if(!item.svg){ return; }
    var selector = fragment.attr(api.cfg("selector"));
    item.svg.selectAll(selector)
      .transition()
      .style({opacity: show ? 1 : 0});

    return api;
  };


  // the iframe was created for this item
  api.iframed = function(item){
    item.iframe = d3.select(this);
    item.idoc = d3.select(this.contentDocument);
    item.svg = item.idoc.select("svg");
    item.dims = {
      width: item.svg.attr("width") || 100,
      height: item.svg.attr("height") || 100
    };
    item.iframe.attr(item.dims);
    // see https://groups.google.com/forum/#!topic/d3-js/mTBxTLi0q1o
    item.svg.attr({
      width: "100%",
      height: "100%",
      viewBox: "0 0 "+ item.dims.width + " " + item.dims.height
    });

    return api.clean(item);
  };

  // prepare
  // TODO: smarter initialization?
  api.clean = function(item){
    var base;
    item.container.selectAll(".fragment").each(function(){
      item.svg.selectAll(d3.select(this).attr(api.cfg("selector")))
        .style({opacity: 0});
    });

    if(base = item.url.match(/(?:#)(.*)$/)){
      item.svg.selectAll(base[1])
        .style({opacity: 1});
    }

    return api;
  };


  // preflight, call immediately it d3 is available, otherwise load the script
  api.init = function(){
    var options = Reveal.getConfig().svgFragment || {};
    if(window.d3){
      api();
    }else if(window.require){
      require([api.cfg("d3")], function(_d3){
        d3 = _d3;
        api();
      });
    }else{
      api.load(api.cfg("d3"), api);
    }
    return api;
  };


  // get configuration values (or defaults)
  api.cfg = function(opt){
    var cfg = Reveal.getConfig().svgFragment || {};

    return cfg.hasOwnProperty(opt) ? cfg[opt] :
      defaults.hasOwnProperty(opt) ? defaults[opt] :
      function(){ throw new Error("Unknown property: "+ opt); };
  };


  // load a script, jacked from search, i think
  api.load = function(url, callback){
    var head = document.querySelector('head'),
      script = document.createElement('script');

    // Wrapper for callback to make sure it only fires once
    var finish = function(){
      if(typeof callback === 'function') {
        callback.call();
        callback = null;
      }
    };

    // IE
    script.onreadystatechange = function() {
      if (this.readyState === 'loaded') {
        finish();
      }
    };
    script.type = 'text/javascript';
    script.src = url;
    script.onload = finish;

    // Normal browsers
    head.appendChild(script);

    return api;
  };


  return api.init();
}).call(this, Reveal);
