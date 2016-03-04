![EbookAccess showed in Primo](https://julius.hj.se/cdn/EbookAccess.jpg)

## Setup

1. Copy the [Google Spreadsheet](https://docs.google.com/spreadsheets/d/1LVFhEjv_vsWbr0Zatr4dc_ySAeBYooiMTjfpJpS1UGw/edit#gid=09)
2. Publish it to web.
3. Update `EbookAccess.config.request.url` to match the new Spreadsheet *(Just change the id of the spreadsheet to the new one)*
4. Change `EbookAccess.config.icon.directory` to match where you will upload the images.
5. Change `EbookAccess.config.icon.fileType` to match the desired format of the icons.
6. Upload `EbookAccess.js` to your preferred server.
7. Include the script in SFX.
8. Run the script using `EbookAccess.initialize(language);` where language is the language code *(two digit string)* you're using in SFX, default available is swedish `sv` and english `en`. This is probably easiest done through the SFX-templates.

### Notes

For the script to work three files must match:

1. The spreadsheet must follow the correct format with correctly named headings for example: `loantime`, `loantimecommentswedish`, `loantimecommentenglish`.
2. All the headings should be added to `EbookAccess.config.icons`
3. Add the corresponsing image of the icon to the directory defined in `EbookAccess.config.iconDirectory`.

## Links

* [Google Spreadsheet](https://docs.google.com/spreadsheets/d/1LVFhEjv_vsWbr0Zatr4dc_ySAeBYooiMTjfpJpS1UGw/edit#gid=09)
* [Demo](http://julius.hj.se/xtest/SFX%20Test/index.html)
* [Zipped folder with Icons in pixel format](//julius.hj.se/cdn/Icons.zip)
* [Zipped folder with Icons in vector format](//julius.hj.se/cdn/Icons (Vector).zip)
