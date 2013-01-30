SHELL := /bin/bash
VERSION := $(shell cat install.rdf|grep '<em:version>'|cut -d\> -f2|cut -d\< -f1)

clean:
	rm -f ../torbirdy-$(VERSION).xpi

make-xpi:
	zip -r ../torbirdy-$(VERSION).xpi * -x "/screenshots/*" -x "*/screenshots/*"  -x "debian/*" -x "patches/*" -x "TODO" -x "ChangeLog"

git-tag:
	git tag -u 0xD81D840E -s $(VERSION)

git-push:
	git push --tags
	git push

sign-release:
	gpg -u 0xD81D840E -abs ../torbirdy-${VERSION}.xpi$
	sha1sum ../torbirdy-${VERSION}.xpi$

push-release:
	chmod 664 ../torbirdy-${VERSION}.xpi*$
	scp ../torbirdy-${VERSION}.xpi* vescum.torproject.org:/srv/www-master.torproject.org/htdocs/dist/torbirdy/$
	scp ../torbirdy-${VERSION}.xpi vescum.torproject.org:/srv/www-master.torproject.org/htdocs/dist/torbirdy/torbirdy-current.xpi$
	scp ../torbirdy-${VERSION}.xpi.asc vescum.torproject.org:/srv/www-master.torproject.org/htdocs/dist/torbirdy/torbirdy-current.xpi.asc$
	ssh vescum.torproject.org ~mirroradm/bin/trigger-mirrors
	
release: sign-release push-release
	
