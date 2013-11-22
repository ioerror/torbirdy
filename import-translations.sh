#!/bin/sh

# Script to fetch and update translations. Modified from tor-launcher.

BUNDLE_LOCALES="ar da eu he lv pa pt_BR tr cs de es fr it nl pl sv zh-CN ms-MY ja"

if [ -d translation ];
then
  cd translation
  git fetch origin
  cd ..
else
  git clone https://git.torproject.org/translation.git
fi

cd translation
for i in $BUNDLE_LOCALES
do
  UL="`echo $i|tr - _`"

  git checkout torbirdy
  git merge origin/torbirdy
  cp $UL/torbirdy.dtd ../chrome/locale/$i/torbirdy.dtd
  cp $UL/torbirdy.properties ../chrome/locale/$i/torbirdy.properties
done
