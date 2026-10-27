# Professional colour system

The purple, blue and plum palette is replaced by one set of colour tokens at the top of `src/index.css`: a warm off-white canvas, white cards, charcoal text and ink buttons, with a single evergreen accent for progress, success and focus. Colour is kept for meaning. Amber, teal and green mark task stages, and only high and critical priorities are tinted. The `royal.css` and `tech.css` override layers are folded into the base stylesheet, the command menu and task badges get their own stylesheets, and chart, avatar and status colours come from the same palette.

All text colours meet WCAG AA contrast (4.5:1 or more) against their backgrounds, and form fields keep a 3:1 edge. The board's five columns now fit a 1440px screen without sideways scrolling. Review at 390px, 768px and 1440px. Functionality and stored data are unchanged.
