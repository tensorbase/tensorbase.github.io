---
layout: post
title: "Engineering Rust Tips #1: Proc Macro Debugging"
date: 2021-01-08
---

## Preamble
Developing high-performance systems is a mind-twisting task. We face endless clever or stupid cases to conquer. It is very meaningful that we leave thoughts here.

This series do not try to solve hard engineering puzzles. We just present fast-reading pieces to reflect what problem we meet in this project(a high performance data sytem) and how we solve them in an elegant way by modern Rust.

The idea of this series is inspired by our recent Rust Chinese community's conferences and online talkings. To make more people in the whole community known the works we done in current Chinese community, I post this series in English.


## Proc Macro
Proc macro is an relatively unique language characteristics in Rust. It is great for library writers but notorious to figure out the problems when bugs happen. Unfortunately, bugs always happen no matter you are... So, I suggest using self-brewed proc macros carefully in the large engineering.

But sometimes, the desires to have more advanced representations exceed the fear from coding for the proc macro. You start to try!

Commonly you've known, ```cargo expand``` and ```eprintln!```[1]. They are generally good, but a little boring works to make them inconvenient. And sometimes, they meet problems for temporary broken IDEs or you just do not want invasive output.

Here, I suggest two other ways which I used in the Base engineering.

## Proc_macro_diagnostic API

The nightly has introduced "Procedural Macro Diagnostics" APIs under the feature "proc_macro_diagnostic" as friendly dump tools which is seamlessly integrated into the proc macro output.

Here, I use [the s! macro in TensorBase as an example](https://github.com/tensorbase/tensorbase/blob/812ade62dec267652cc21373bb5efddda9097925/crates/base/tests/proc_macro_tests.rs#L35), which makes your writing C, Java like codes in your Rust sources in a free style. (In fact, this is just a raw token container with in-Rust value interpolation, you can embed almost any language in Rust using it.)

In a normal working scenarios, like this:

<div>
<img class="center_img" src="/img/eng_rust_tips_1/ok_java_code_in_rust.png"/>
</div>

expected gen-ed code is this:

<div>
<img class="center_img" src="/img/eng_rust_tips_1/ok_test_output.png"/>
</div>

When I miss a delimiter $, then it panics,

<div>
<img class="center_img" src="/img/eng_rust_tips_1/panic_java_in_rust.png"/>
</div>
here, we do not quickly understand the exact problem even that we can roll the vscode console to that panic point for some print-outs.

Then, we use diag APIs in the potential key parsing point:

<div>
<img class="center_img" src="/img/eng_rust_tips_1/use_pm_diag.png"/>
</div>

We got this:
<p></p>
<div>
<img class="center_img" src="/img/eng_rust_tips_1/proc_macro_diags_err_lite.png"/>
</div>
We find that is an error prompt in RA, and it is said that what's the problem identity and the location/span of this ident (Note: here the span is not exact which may be confirmed by Rust core team).

By change function call from "error" to "warning", we got a non-blocking prompt like this:
<p></p>
<div>
<img class="center_img" src="/img/eng_rust_tips_1/proc_macro_diags_warn_lite.png"/>
</div>

There are four APIs: __error__, __warning__, __help__ and __note__ on Span for your favors.

Great user-friendly proc macro diag experiences!


## Unit Testability for Proc Macro

Generally, the proc macro is just one compiler plugin kind to run at compilation time. However, it is even hard to a entrance for the compilation time debugging in that we are not language developers.

So, another not well known way is, our core team gradually makes the proc macro unit testability. 

You just write a unit testability friendly tests like your conventional unit tests, for example, [unit tests for above s! macro test](https://github.com/tensorbase/tensorbase/blob/812ade62dec267652cc21373bb5efddda9097925/crates/base/proc_macro/src/lib.rs#L101).

The advantage of unit test is that you use every swiss knifes in your toolbox with a right engineering style(no any adhoc setup). 

For example, I enable the native debugging to the test to see what I have in kinds of proc macro syntax objects, like TokenStream here on the fly:

<div>
<img class="center_img" src="/img/eng_rust_tips_1/proc_marco_unit_test.png" width="75%"/>
</div>

Do not need to add endless prints in you code any more!

Finally, I hope fearless proc macro programming coming soon:)


## References
1. [cargo expand](https://github.com/dtolnay/cargo-expand)
2. [debugging-tips from Dtolnay](https://github.com/dtolnay/proc-macro-workshop#debugging-tips)
3. [Tracking Issue: Procedural Macro Diagnostics (RFC 1566)](https://github.com/rust-lang/rust/issues/54140)