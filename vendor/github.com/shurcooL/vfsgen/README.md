vfsgen
======

[![Build Status](https://travis-ci.org/shurcooL/vfsgen.svg?branch=master)](https://travis-ci.org/shurcooL/vfsgen) [![GoDoc](https://godoc.org/github.com/shurcooL/vfsgen?status.svg)](https://godoc.org/github.com/shurcooL/vfsgen)

Package vfsgen takes an http.FileSystem (likely at `go generate` time) and
generates Go code that statically implements the provided http.FileSystem.

Features:

-	Efficient generated code without unneccessary overhead.

-	Uses gzip compression internally (selectively, only for files that compress well).

-	Enables direct access to internal gzip compressed bytes via an optional interface.

-	Outputs `gofmt`ed Go code.

Installation
------------

```bash
go get -u github.com/shurcooL/vfsgen
```

Usage
-----

Package `vfsgen` is a Go code generator library. It has a `Generate` function that takes an input filesystem (as a [`http.FileSystem`](https://godoc.org/net/http#FileSystem) type), and generates a Go code file that statically implements the contents of the input filesystem.

For example, we can use [`http.Dir`](https://godoc.org/net/http#Dir) as a `http.FileSystem` implementation that uses the contents of the `/path/to/assets` directory:

```Go
var fs http.FileSystem = http.Dir("/path/to/assets")
```

Now, when you execute the following code:

```Go
err := vfsgen.Generate(fs, vfsgen.Options{})
if err != nil {
	log.Fatalln(err)
}
```

An assets_vfsdata.go file will be generated in the current directory:

```Go
// Code generated by vfsgen; DO NOT EDIT.

package main

import ...

// assets statically implements the virtual filesystem provided to vfsgen.Generate.
var assets http.FileSystem = ...
```

Then, in your program, you can use `assets` as any other [`http.FileSystem`](https://godoc.org/net/http#FileSystem), for example:

```Go
file, err := assets.Open("/some/file.txt")
if err != nil {
	return err
}
defer file.Close()
```

```Go
http.Handle("/assets/", http.FileServer(assets))
```

`vfsgen` can be more useful when combined with build tags and go generate directives. This is described below.

### `go generate` Usage

vfsgen is great to use with go generate directives. The code invoking `vfsgen.Generate` can go in an assets_generate.go file, which can then be invoked via "//go:generate go run assets_generate.go". The input virtual filesystem can read directly from disk, or it can be more involved.

By using build tags, you can create a development mode where assets are loaded directly from disk via `http.Dir`, but then statically implemented for final releases.

For example, suppose your source filesystem is defined in a package with import path "example.com/project/data" as:

```Go
// +build dev

package data

import "net/http"

// Assets contains project assets.
var Assets http.FileSystem = http.Dir("assets")
```

When built with the "dev" build tag, accessing `data.Assets` will read from disk directly via `http.Dir`.

A generate helper file assets_generate.go can be invoked via "//go:generate go run -tags=dev assets_generate.go" directive:

```Go
// +build ignore

package main

import (
	"log"

	"example.com/project/data"
	"github.com/shurcooL/vfsgen"
)

func main() {
	err := vfsgen.Generate(data.Assets, vfsgen.Options{
		PackageName:  "data",
		BuildTags:    "!dev",
		VariableName: "Assets",
	})
	if err != nil {
		log.Fatalln(err)
	}
}
```

Note that "dev" build tag is used to access the source filesystem, and the output file will contain "!dev" build tag. That way, the statically implemented version will be used during normal builds and `go get`, when custom builds tags are not specified.

### `vfsgendev` Usage

`vfsgendev` is a binary that can be used to replace the need for the assets_generate.go file.

Make sure it's installed and available in your PATH.

```bash
go get -u github.com/shurcooL/vfsgen/cmd/vfsgendev
```

Then the "//go:generate go run -tags=dev assets_generate.go" directive can be replaced with:

```
//go:generate vfsgendev -source="example.com/project/data".Assets
```

vfsgendev accesses the source variable using "dev" build tag, and generates an output file with "!dev" build tag.

### Additional Embedded Information

All compressed files implement [`httpgzip.GzipByter` interface](https://godoc.org/github.com/shurcooL/httpgzip#GzipByter) for efficient direct access to the internal compressed bytes:

```Go
// GzipByter is implemented by compressed files for
// efficient direct access to the internal compressed bytes.
type GzipByter interface {
	// GzipBytes returns gzip compressed contents of the file.
	GzipBytes() []byte
}
```

Files that have been determined to not be worth gzip compressing (their compressed size is larger than original) implement [`httpgzip.NotWorthGzipCompressing` interface](https://godoc.org/github.com/shurcooL/httpgzip#NotWorthGzipCompressing):

```Go
// NotWorthGzipCompressing is implemented by files that were determined
// not to be worth gzip compressing (the file size did not decrease as a result).
type NotWorthGzipCompressing interface {
	// NotWorthGzipCompressing is a noop. It's implemented in order to indicate
	// the file is not worth gzip compressing.
	NotWorthGzipCompressing()
}
```

Comparison
----------

vfsgen aims to be conceptually simple to use. The [`http.FileSystem`](https://godoc.org/net/http#FileSystem) abstraction is central to vfsgen. It's used as both input for code generation, and as output in the generated code.

That enables great flexibility through orthogonality, since helpers and wrappers can operate on `http.FileSystem` without knowing about vfsgen. If you want, you can perform pre-processing, minifying assets, merging folders, filtering out files and otherwise modifying input via generic `http.FileSystem` middleware.

It avoids unneccessary overhead by merging what was previously done with two distinct packages into a single package.

It strives to be the best in its class in terms of code quality and efficiency of generated code. However, if your use goals are different, there are other similar packages that may fit your needs better.

### Alternatives

-	[`go-bindata`](https://github.com/jteeuwen/go-bindata) - Reads from disk, generates Go code that provides access to data via a [custom API](https://github.com/jteeuwen/go-bindata#accessing-an-asset).
-	[`go-bindata-assetfs`](https://github.com/elazarl/go-bindata-assetfs) - Takes output of go-bindata and provides a wrapper that implements `http.FileSystem` interface (the same as what vfsgen outputs directly).
-	[`becky`](https://github.com/tv42/becky) - Embeds assets as string literals in Go source.
-	[`statik`](https://github.com/rakyll/statik) - Embeds a directory of static files to be accessed via `http.FileSystem` interface (sounds very similar to vfsgen); implementation sourced from [camlistore](https://camlistore.org).
-	[`go.rice`](https://github.com/GeertJohan/go.rice) - Makes working with resources such as HTML, JS, CSS, images and templates very easy.
-	[`esc`](https://github.com/mjibson/esc) - Embeds files into Go programs and provides `http.FileSystem` interfaces to them.
-	[`staticfiles`](https://github.com/bouk/staticfiles) - Allows you to embed a directory of files into your Go binary.
-	[`togo`](https://github.com/flazz/togo) - Generates a Go source file with a `[]byte` var containing the given file's contents.
-	[`fileb0x`](https://github.com/UnnoTed/fileb0x) - Simple customizable tool to embed files in Go.
-	[`embedfiles`](https://github.com/leighmcculloch/embedfiles) - Simple tool for embedding files in Go code as a map.
-	[`packr`](https://github.com/gobuffalo/packr) - Simple solution for bundling static assets inside of Go binaries.
-	[`rsrc`](https://github.com/akavel/rsrc) - Tool for embedding .ico & manifest resources in Go programs for Windows.

Attribution
-----------

This package was originally based on the excellent work by [@jteeuwen](https://github.com/jteeuwen) on [`go-bindata`](https://github.com/jteeuwen/go-bindata) and [@elazarl](https://github.com/elazarl) on [`go-bindata-assetfs`](https://github.com/elazarl/go-bindata-assetfs).

License
-------

-	[MIT License](LICENSE)
