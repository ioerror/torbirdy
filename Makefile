SHELL := /bin/bash
VERSION := $(shell cat install.rdf|grep '<em:version>'|cut -d\> -f2|cut -d\< -f1)

make-xpi:
	zip -r ../torbirdy-$(VERSION).xpi *
