## Description

Fin Spell is an experimental Finnish spellchecking add-on for Firefox. It tries
to closely emulate the built-in spellchecking feature. This project was started,
because the old Finnish spellchecking add-on, Mozvoikko, is a XUL add-on and
they were deprecated, and Hunspell or MySpell formatted dictionaries aren't well
suited for Finnish.

This add-on is based on libvoikko, like the old Mozvoikko.

## Limitations

Users can't add new words, the add-on must be upgraded to use a new
dictionary.

## Compiling libvoikko

I did this on Ubuntu 19.04. You can copy these commands all at once to the
terminal.

```
# Get emsdk, I couldn't compile with the latest version.
git clone https://github.com/juj/emsdk.git
cd emsdk
./emsdk update-tags
./emsdk install sdk-1.38.30-64bit
./emsdk activate sdk-1.38.30-64bit
source ./emsdk_env.sh
cd ..

# Libvoikko. I used version rel-libvoikko-4.2
git clone https://github.com/voikko/corevoikko
cd corevoikko/libvoikko
git checkout rel-libvoikko-4.2 

# Get the dictionary.
# sha256sum: eb3730ec8c3ff8be444479540ce33566d98cc19ecdda1077427556d4e48ad431
wget https://www.puimula.org/htp/testing/voikko-snapshot-v5/dict-morpho.zip
unzip dict-morpho.zip
rm dict-morpho.zip

# Needs automake, autocong and pkg-config packages.
# Install libtool if you get error: possibly undefined macro: AC_LIBTOOL_WIN32_DLL.
# You might need to install libtinfo5 and openjdk-X-jdk also.
./autogen.sh
js/configure.sh
js/build.sh preload
# libvoikko.data, libvoikko_api.js, libvoikko.js and libvoikko.wasm which
# are used in this add-on are in js/.
```

## Other requirements

content_scripts/jquery_highlight_combined.js is a concatenation of jQuery and
highlight-within-textarea JavaScript files.

https://code.jquery.com/jquery-3.3.1.min.js

https://github.com/lonekorean/highlight-within-textarea/raw/master/jquery.highlight-within-textarea.js

content_scripts/jquery.highlight-within-textarea.css's source is
https://github.com/lonekorean/highlight-within-textarea/raw/master/jquery.highlight-within-textarea.css.

## License

GPL3.

## Download

[v0.1.0](https://github.com/fluks/fin-spell/releases/download/v0.1.0/fin_spell-0.1.0-fx.xpi)
