js := \
	background/*.js \
	options/*.js \
	content_scripts/*.js \
	browser_action/*.js \
	common/*.js \
	sidebar/*.js \
	l10n/*.js
locale_files := $(shell find _locales -type f)
common_files := \
	manifest.json \
	background/* \
	options/* \
	content_scripts/* \
	browser_action/* \
	LICENSE \
	libvoikko.data \
	common/* \
	sidebar/* \
	l10n/* \
	$(locale_files)
firefox_files := \
	data/*.svg \
	$(common_files)
chromium_files := \
	$(common_files)

firefox-bin := ~/Downloads/firefox_dev/firefox
ff-profile := dev-edition-default

version_suffix := $(shell grep -o '[0-9]\.[0-9]\.[0-9]' manifest.json | head -1 | sed 's/\./_/g')

.PHONY: run firefox chromium clean change_to_firefox change_to_chromium lint \
	doc supported_versions compare_install_and_source

run:
	web-ext \
		-f $(firefox-bin) \
		--pref intl.locale.requested=fi \
		--pref layout.spellcheckDefault=0 \
		-u 'about:debugging#/runtime/this-firefox' \
		-u 'about:devtools-toolbox?type=extension&id=finspell%40fluks' \
		-u about:addons \
		-u https://css-tricks.com/examples/TextareaTricks/ \
		--verbose \
		-p $(ff-profile) \
		run

firefox: change_to_firefox
	zip -r fin_spell-$(version_suffix).xpi $(firefox_files)

chromium: change_to_chromium
	zip fin_spell-$(version_suffix).zip $(chromium_files)

change_to_firefox:
	cp firefox/manifest.json .

change_to_chromium:
	cp chromium/manifest.json .

# web-ext lint finds errors if manifest.json isn't the Firefox version.
lint: change_to_firefox
	# Check JSON syntax.
	$(foreach file,$(locale_files),json_xs -f json < $(file) 1>/dev/null;)
	web-ext lint --ignore-files doc/* --ignore-files background/libvoikko.js
	eslint $(js)

supported_versions:
	# Set verbosity on command line: verbosity='-v{1,2}'
	min_ext_ver.pl -b firefox,chrome $(verbosity) $(js)

# usage: make compare_install_and_source install=PATH1 source=PATH2
# where PATH1 is path to the installed addon in
# ~/.mozilla/firefox/PROFILE/extensions/redirectlink@fluks.xpi and PATH2 is
# path to the generated xpi you can create with make firefox.
tmp_install := /tmp/_install
tmp_source := /tmp/_source
compare_install_and_source:
	@mkdir $(tmp_install)
	@unzip -qqd $(tmp_install) $(install)
	@rm -rf $(tmp_install)/META-INF
	@mkdir $(tmp_source)
	@unzip -qqd $(tmp_source) $(source)
	diff -r $(tmp_install) $(tmp_source)
	@rm -rf $(tmp_install) $(tmp_source)

doc:
	jsdoc -c conf.json -d doc $(js)

clean:
	rm manifest.json
