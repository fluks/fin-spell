## Description

Fin Spell is an experimental Finnish spellchecking add-on for Firefox. It tries
to closely emulate the built-in spellchecking feature. This project was started,
because the old Finnish spellchecking add-on, Mozvoikko, is a XUL add-on and
they were deprecated, and Hunspell or MySpell formatted dictionaries aren't well
suited for Finnish.

This add-on is based on libvoikko, like the old Mozvoikko.

## Limitations

* Many elements that function like a textarea doesn't work at all or the highlighting is off.
* Users can't add new words to be used with libvoikko, the add-on must be upgraded to use a new
dictionary, but users can now add words to be used as wordlist.
* Writing fast or a longer piece of text can start lagging.

## Compiling libvoikko

I did this on Ubuntu 19.04. You can copy these commands all at once to the
terminal.

```
# Get emsdk, I couldn't compile with the latest version.
git clone https://github.com/juj/emsdk.git
cd emsdk
./emsdk update-tags
./emsdk install sdk-fastcomp-1.38.30-64bit
./emsdk activate sdk-fastcomp-1.38.30-64bit
source ./emsdk_env.sh
cd ..

# Libvoikko. I used version rel-libvoikko-4.3
git clone https://github.com/voikko/corevoikko
cd corevoikko/libvoikko
git checkout rel-libvoikko-4.3

# Get the dictionary.
# sha256sum: 136e8142dd34ddf181919decb742897a4f055e7fa12d4dcc8b5c9cb6660488da
wget https://www.puimula.org/htp/testing/voikko-snapshot-v5/dict-morpho.zip
unzip dict-morpho.zip
rm dict-morpho.zip

# Needs automake, autoconf and pkg-config packages.
# Install libtool if you get error: possibly undefined macro: AC_LIBTOOL_WIN32_DLL.
# You might need to install libtinfo5 and openjdk-X-jdk also.
./autogen.sh
js/configure.sh
sh js/build.sh preload
# libvoikko.data, libvoikko_api.js, libvoikko.js and libvoikko.wasm which
# are used in this add-on are in js/.
```

## Other requirements

content_scripts/jquery_highlight_combined.js is a concatenation of jQuery and
highlight-within-textarea JavaScript files.

https://code.jquery.com/jquery-3.3.1.min.js

https://github.com/Dalimil/highlight-within-textarea/raw/master/jquery.highlight-within-textarea.js

content_scripts/jquery.highlight-within-textarea.css's source is
https://github.com/Dalimil/highlight-within-textarea/raw/master/jquery.highlight-within-textarea.css

## Building

* See Compiling libvoikko first.
* `make change_to_firefox`
* Install web-ext so that web-ext executable is in the PATH.
* Change `firefox-bin` variable in Makefile to point to a Firefox binary you want to use.
* Change `ff-profile` variable in Makefile to an existing Firefox profile you want to use.
* `make run`

## License

GPL3.

## Download

[AMO](https://addons.mozilla.org/en-US/firefox/addon/fin-spell/)
