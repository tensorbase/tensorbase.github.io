---
layout: post
title: "Engineering Rust Tips #1: Proc Macro Debugging"
date: 2021-01-08
---

## Preamble
Developing high-performance systems is a mind-twisting task. We face endless clever or stupid cases to conquer. It is very meaningful that we leave thoughts here to benefit all.

This series hope to present that **fast-reading tips**, from a viewpoint of real engineering, to reflect the problem we meet in [this project](https://tensorbase.io/) and how we solve them in an elegant way by the modern Rust.

The idea of this series is inspired by our recent Rust Chinese community's conferences and online talkings. I really love our Rust community and thanks for all the help got from the community.


## Proc Macro
Proc macro is an relatively unique language characteristics in Rust. It is great for library writers but notorious to figure out the problem when bugs happen. Unfortunately, bugs always happen... So, it should be careful to use self-brewed proc macros in large engineering.

Sometimes, the desires to have more advanced representations exceed the fear from coding for the proc macro. You start to try!

Commonly you've known, ```cargo expand``` and ```eprintln!```[1]. They are generally good with a little boring works to make them inconvenient. Occasionally, they meet problems for temporary broken IDEs or that you just do not want invasive prints.

Here, I suggest two other ways which I used in the Base engineering.

## Proc_macro_diagnostic API

The nightly has introduced "Procedural Macro Diagnostics" APIs [3] under the feature "proc_macro_diagnostic" as friendly diag-info-show tool which is seamlessly integrated into the proc macro output.

Here, I use [the s! macro in TensorBase as an example](https://github.com/tensorbase/tensorbase/blob/812ade62dec267652cc21373bb5efddda9097925/crates/base/tests/proc_macro_tests.rs#L35), which makes your writing C, Java like codes in your Rust sources in a free style. (In fact, this is just a raw token container with in-Rust value interpolation, you can embed almost any language in Rust using it.)

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
Here, we may not quickly understand the exact problem in that we have no useful indication.

Then, we use diag APIs in the potential key parsing point:

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
We find that is an error prompt in vscode/RA, and it is said that what's the problem identity and the location/span of this ident (Note: here the span is not exact which may be a bug or just a surprise).

By changing function call from "error" to "warning", we got a "non-blocking" warning style prompt like this:
<p></p>
<div>
<img class="center_img_wider" src="/img/eng_rust_tips_1/proc_macro_diags_warn_lite.png"/>
</div>
<p/>
There are four APIs: __error__, __warning__, __help__ and __note__ on Span for your favors. Consult the tracking issue for more[3] .

In a real engineering, it is easy to provide a in-Rust language direct editing experience to use a external language compilers (e.g. GCC, JavaC) on top of this diagnostics API.

Great user-friendly proc macro diag experiences!


## Unit Testability for Proc Macro

Generally, the proc macro is just one compiler plugin kind to run at compilation time. However, it is even hard to figure out a good entrance for this kind debugging in that we are not language developers.

Another not-well-known way is, our core team gradually makes the proc macro unit testable (WIP). 

You just write a unit-testability-friendly tests like your conventional unit tests, for example, [unit tests for above s! macro test](https://github.com/tensorbase/tensorbase/blob/812ade62dec267652cc21373bb5efddda9097925/crates/base/proc_macro/src/lib.rs#L101).

The advantage of unit test is that you use every swiss knifes in your toolbox with a right engineering style(no any adhoc setup). 

For example, I enable the native debugging to the test to see what I have in kinds of proc macro syntax objects, like TokenStream here just by one click in RA:

<div>
<img class="center_img_wider" src="/img/eng_rust_tips_1/proc_marco_unit_test.png"/>
</div>
<p/>
Neat! Do not need endless prints in you code any more!

Finally, I hope fearless proc macro programming coming soon:)


## References
1. [cargo expand](https://github.com/dtolnay/cargo-expand)
2. [Debugging-tips from Dtolnay](https://github.com/dtolnay/proc-macro-workshop#debugging-tips)
3. [Tracking Issue: Procedural Macro Diagnostics (RFC 1566)](https://github.com/rust-lang/rust/issues/54140)