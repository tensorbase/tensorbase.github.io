---
layout: post
title: "Engineering Rust Tips #1: Proc Macro Debugging"
date: 2021-01-08
---

## Preamble
Developing high-performance systems is a mind-twisting task. We face endless clever or stupid cases to conquer. It could be meaningful that we leave thoughts here to benefit all.

This series hopes to present **fast-reading tips**, from a viewpoint of real engineering. We aim to reflect on the problems that we meet in [this project](https://tensorbase.io/) and how we solved them in an elegant way with modern Rust.

The idea of this series is inspired by our recent Rust Chinese Community conferences and online talks. I really love our Rust community and want to give thanks for all the help I got from the community.


## Proc Macro
Proc macro is an relatively unique language characteristics in Rust. It is great for library writers but notoriously difficult to figure out the problem when bugs happen. Unfortunately, bugs always happen... So, it should be with careful care that you use self-brewed proc macros in large engineering projects.

Sometimes, the desire to have more advanced representations exceed the fear from coding proc macros. You start to try!

Commonly you've known, ```cargo expand``` and ```eprintln!```[1]. They are generally good but with a little boring works to make them sometimes inconvenient. Occasionally, they meet problems with temporary broken IDEs or that you just do not want invasive prints.

Here, I suggest two other ways which I used with engineering Base.

## Proc_macro_diagnostic API

The nightly release has introduced "Procedural Macro Diagnostics" APIs [3] under the feature "proc_macro_diagnostic" as a friendly diag-info-show tool which is seamlessly integrated into the proc macro output.

Here, I use [the s! macro in TensorBase as an example](https://github.com/tensorbase/tensorbase/blob/812ade62dec267652cc21373bb5efddda9097925/crates/base/tests/proc_macro_tests.rs#L35), which allows you to write C, Java like code in your Rust sources in a free style. (In fact, this is just a raw token container with in-Rust value interpolation, you can embed almost any language in Rust using it.)

A normal working scenario like this:

<div>
<img class="center_img" src="/img/eng_rust_tips_1/ok_java_code_in_rust.png"/>
</div>
<p/>
Expected gen-ed code is this:

<div>
<img class="center_img" src="/img/eng_rust_tips_1/ok_test_output.png"/>
</div>
<p/>
When I miss a delimiter $ for dsadsa, then it just panics,

<div>
<img class="center_img" src="/img/eng_rust_tips_1/panic_java_in_rust.png"/>
</div>
<p/>
Here, we may not quickly understand the exact problem because we have no useful indication.

Now we can use diag APIs in the potential key parsing points, like:

<div>
<img class="center_img_wider" src="/img/eng_rust_tips_1/use_pm_diag.png"/>
</div>
<p/>

And try another case - interpolated variable typo, we got this:
<p></p>
<div>
<img class="center_img_wider" src="/img/eng_rust_tips_1/proc_macro_diags_err_lite.png"/>
</div>
<p/>
We find an error prompt immediately in vscode/RA, which shows what the problems identity is and the location/span of this ident (Note: here the span is not exact which may be a bug or just a surprise).

By changing the API call from "error" to "warning", we get a "non-blocking" warning style prompt like this:
<p></p>
<div>
<img class="center_img_wider" src="/img/eng_rust_tips_1/proc_macro_diags_warn_lite.png"/>
</div>
<p/>
There are four APIs: __error__, __warning__, __help__ and __note__ on Span for depending on your needs. Consult the tracking issue for more info[3] .

In real engineering, it is not hard to provide an in-Rust direct external language editing experience to use that language compiler(e.g. GCC, JavaC) on top of this diagnostics API.

Great user-friendly proc macro diag experience!


## Unit Testability for Proc Macro

Generally, the proc macro is just one type of compiler plugin that runs at compilation time. However, it is hard to figure out a good entrance for this kind debugging because we are not language developers.

Another not-well-known way to do this that our core team is gradually making the proc macro unit testable (WIP). 

You just write a unit-testability-friendly test like your conventional unit tests, for example, [unit tests for above s! macro test](https://github.com/tensorbase/tensorbase/blob/812ade62dec267652cc21373bb5efddda9097925/crates/base/proc_macro/src/lib.rs#L101).

The advantage of unit test is that you can use every swiss knife in your toolbox with the right  engineering style (don't need any adhoc setup). 

For example, I enable the live debugging of the test to see what I have in diffrent kinds of proc macro syntax objects. Like with TokenStream here I just need one click in RA:

<div>
<img class="center_img_wider" src="/img/eng_rust_tips_1/proc_marco_unit_test.png"/>
</div>
<p/>
Neat! Do not need endless prints in you code any more!

Finally, it is hoped that fearless proc macro programming is coming soon:)

## [Comments](https://www.reddit.com/r/rust/comments/kszyoa/engineering_rust_tips_1_proc_macro_debugging/)

## References
1. [cargo expand](https://github.com/dtolnay/cargo-expand)
2. [Debugging-tips from Dtolnay](https://github.com/dtolnay/proc-macro-workshop#debugging-tips)
3. [Tracking Issue: Procedural Macro Diagnostics (RFC 1566)](https://github.com/rust-lang/rust/issues/54140)
