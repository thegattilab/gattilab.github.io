# thegattilab.ai

Website for The Gatti Lab at the University of Michigan. It is plain HTML, CSS, and JavaScript, with no build step.

## Preview

```
python3 -m http.server 8770 --bind 127.0.0.1
```

Then open http://127.0.0.1:8770.

## Files

- `index.html`: the homepage, in Michigan blue. All of the words and links are here.
- `bone.html`: the same page on bone-coloured paper, kept as the alternate version at `/bone.html` and hidden from search engines. Word changes need making in both files.
- `assets/style.css`: layout, colours, and type. Adding `class="blue"` to `<body>` selects the blue colours.
- `assets/morph.js`: the animated knee.
- `assets/favicon.svg`, `assets/og-image.png`: browser tab icon and link preview image.
- `CNAME`: tells GitHub Pages to serve the site at thegattilab.ai.

## The knee is a placeholder

The outline and its modes of variation in `assets/morph.js` are drawn by hand. They are not anatomy data or model output. To use a real shape model, replace `MEAN` and `MODES` as described at the top of that file. To use a rendered animation or image instead, replace the `<svg>` in `index.html`.

Add `?t=20` to the URL to freeze the animation at 20 seconds, which is useful for screenshots. `assets/og-image.png` and the favicon were made from the frame at `t=0`, so they will need regenerating if the shape changes.

## Publishing

1. Push to `main`. On GitHub's free plan the repo must be public to use Pages.
2. In the repo settings under Pages, deploy from the `main` branch, root folder, and set the custom domain to `thegattilab.ai`.
3. At the domain registrar, delete the existing parking records for `thegattilab.ai` and `www`, including any wildcard. Leftover records can stop GitHub issuing the HTTPS certificate.
4. Point `thegattilab.ai` at GitHub Pages with A records for `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, and `185.199.111.153`, and add a `www` CNAME record for `thegattilab.github.io`.
5. Once the certificate is issued, turn on Enforce HTTPS. Until then, browsers will warn that the site is not secure.
