#!/bin/sh

# Script to fetch and update translations. Modified from tor-launcher.

BUNDLE_LOCALES="nl lv de uk ko pl fr nb he el sv sl pt cs it pt-BR  \
                es id ro sr da ca pa en-GB hu sk ru ar eu tr"

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
