SHELL := /bin/bash
VERSION := $(shell cat install.rdf|grep '<em:version>'|cut -d\> -f2|cut -d\< -f1)

make-xpi:
	zip -r ../torbirdy-$(VERSION).xpi * -x "debian/*" -x "patches/*" -x "ChangeLog" -x "Makefile" -x "gpg.conf" -x "import-translations.sh" -x "README.RELEASE"

clean:
	rm -f ../torbirdy-$(VERSION).xpi

git-tag:
	git tag -u 0xD255D3F5C868227F -s $(VERSION)

git-push:
	git push --tags
	git push

sign-release:
	gpg -u 0xD255D3F5C868227F -abs ../torbirdy-${VERSION}.xpi$
	sha1sum ../torbirdy-${VERSION}.xpi$

push-release:
	chmod 664 ../torbirdy-${VERSION}.xpi*
	scp ../torbirdy-${VERSION}.xpi* staticiforme.torproject.org:/srv/dist-master.torproject.org/htdocs/torbirdy/
	scp ../torbirdy-${VERSION}.xpi staticiforme.torproject.org:/srv/dist-master.torproject.org/htdocs/torbirdy/torbirdy-current.xpi
	scp ../torbirdy-${VERSION}.xpi.asc staticiforme.torproject.org:/srv/dist-master.torproject.org/htdocs/torbirdy/torbirdy-current.xpi.asc
	ssh staticiforme.torproject.org static-update-component dist.torproject.org
	
release: sign-release push-release
