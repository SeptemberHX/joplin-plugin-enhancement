# Joplin Plugin Better Image

> Generate from the Joplin plugin template: https://joplinapp.org/api/get_started/plugins/

Allow following md works:

```markdown
![Your Figure Caption Here](/path/to/your/img){width=80%}
```

This plugin can:
* Specific the width/height of the image with `{width=80px}`, `{height=30}`, `{width=50%}`
* Render the image `![]()` in a `<figure>` block with `figcaption`
* Use the `alt` attribute as the figure caption, and display the caption under the image if not empty
* Center alignment for image and caption
* Automatic image numbering

![Cat and Dog](./screenshot/example.png)

## Building the plugin

The plugin is built using Webpack, which creates the compiled code in `/dist`. A JPL archive will also be created at the root, which can use to distribute the plugin.

To build the plugin, simply run `npm run dist`.

The project is setup to use TypeScript, although you can change the configuration to use plain JavaScript.

## Updating the plugin framework

To update the plugin framework, run `npm run update`.

In general this command tries to do the right thing - in particular it's going to merge the changes in package.json and .gitignore instead of overwriting. It will also leave "/src" as well as README.md untouched.

The file that may cause problem is "webpack.config.js" because it's going to be overwritten. For that reason, if you want to change it, consider creating a separate JavaScript file and include it in webpack.config.js. That way, when you update, you only have to restore the line that include your file.
