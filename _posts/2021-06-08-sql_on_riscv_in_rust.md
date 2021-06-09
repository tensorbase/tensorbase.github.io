---
layout: post
title: "SQL on RISC-V Chip in Rust" 
date: 2021-06-08
---

It is honored to announce that TensorBase is the first SQL powered data warehouse running on the real RISC-V chip! 

<p></p>
<div align="center">
<img class="center_img_wider" src="/img/2021-06-08-sql_on_riscv_in_rust/base_on_nezha.gif"/>
</div>
<p align="center">Animation(Win10 wsl2)： run SQL query against TensorBase on real RISC-V chip with 100 M stripped NYC taxi dataset</p>

## Journey

In the early of last week, we got one Nezha RISC-V SBC(Single Board Computer) which shipped with a single-core [Alibaba T-Head C906](https://www.t-head.cn/product/c906?lang=en) RISC-V chip made by Allwinner. We are excited to see if we can make some new interesting stuff for both Rust and RISC-V community.

<p></p>
<div align="center">
<img class="center_img_wider" src="/img/2021-06-08-sql_on_riscv_in_rust/nezha_bootup.jpg"/>
</div>
<p align="center">Light up the Nezha RISC-V SBC</p>

### TensorBase on QEMU

If you are in the first time to develop for the RISC-V platform. It could be better to use the QEMU for RISC-V as your running and debugging target. As our evaluation, QEMU for RISC-V is one of most mature and performant platform for working with RISC-V.

To enable RISC-V development for Rust, you need install the target 'riscv64gc-unknown-linux-gnu' via rustup (or something way you like). Then, you need install cross-platform compilation tools like GCC or CLANG for RISC-V arch. And it is better to explicitly specify the tool commands in RUSTFLAGS way or as in [our like config.toml](https://github.com/tensorbase/tensorbase/blob/riscv/.cargo/config.toml).

Next, we go with our good-shape-enough TensorBase sources with 

```
cargo build --release --target=riscv64gc-unknown-linux-gnu
```

There are many cross-platform-compilation ignoring feature warnings here. As our testing, these should but can not be eliminated by kinds of ways. So the only workaround is that you redirect the output into a file and check it with other tools. 
```
...
'+rdrnd' is not a recognized feature for this target (ignoring feature)
'+avx' is not a recognized feature for this target (ignoring feature)
'+mmx' is not a recognized feature for this target (ignoring feature)
'+mmx' is not a recognized feature for this target (ignoring feature)
'+sahf' is not a recognized feature for this target (ignoring feature)
'-xop' is not a recognized feature for this target (ignoring feature)
...
```

There are several compilation errors happened. And it is simple to fix them. One of biggest change is that the cranelift side lightjit engine can not support current RISC-V target. As a result, the partition key expressions have been disabled by the removal of relative codes. This could be resolved that we use some fallback mechanism for partition key expression evaluations in the future.

With some verbose porting work, we finally make the TensorBaser server binary out. After another verbose processing of QEMU setup, we finally pass our TensorBase integration tests in the QEMU. Exciting!

<p></p>
<div align="center">
<img class="center_img_wider" src="/img/2021-06-08-sql_on_riscv_in_rust/base_on_qemu_riscv.png"/>
</div>
<p align="center">Successfully run TensorBase integration tests in the QEMU</p>

Checkout [the sources here](https://github.com/tensorbase/tensorbase/tree/riscv) yourself!

### TensorBase on Nezha SBC with C906 chip

Running in VM does not mean it can run in the real chip. 

One of problem of Nezha SBC is that the ISA in C906 chip is a modified version and has slight difference to that of official RISC-V ISA. At least, we have confirmed that the TensorBase server binary linked by the official GCC RISC-V toolchain can not run on this T-Head C906 chip. 

The solution is that you use the GCC toolings from Allwinner's dedicated [Tina SDK](https://d1.docs.allwinnertech.com/source/4_tinaversion/). After some still-verbose setups and compilations, we got the cross compilation GCC worked. 

Finally, we successfully boot our TensorBase from a SD card.

<p></p>
<div align="center">
<img class="center_img_wider" src="/img/2021-06-08-sql_on_riscv_in_rust/base_server_up_nezha.png"/>
</div>
<p align="center">Boot TensorBase up from a SD card</p>


## Evaluation

### Image size

|arch | size (in bytes)|
:-: | :-----------:
RISC-V | 13086128
X86    | 21200168

Size of output binary for RISC-V is about ~ 61% that of x86. Cool! 

Compared to x86, RISC-V has a wonderful code density character. This will lead to less i-cache and image memory pressure, and finally favors better performance. We like clean works, and RISC-V has a bright future!

### Memory bandwidth

To make a benchmark against the memory bandwidth, we use a [memcpy routine from r/RISCV](https://www.reddit.com/r/RISCV/comments/mw50vo/test_of_standard_glibc_memcpy_vs_riscv_vector/). And we confirmed that the peak memory bandwidth is around 2GB/s as shown in that post. The memory bandwidth is poor compared to the server or even the laptop. But considering we are in DDR3 with much lower frequency, this result is still not bad.

We use the sum aggregation to see how efficient the TensorBase engine of which some part is Arrow/DataFusion. We got 400MB memory scan done in 0.87 second, then our query runtime throughput is about ~450MB/s, which reached the 1/4 of max bandwidth. It is not bad as well, although this shows that the Rust RISC-V binary can not reach the peak memory read capability that seen in x86 cores. This may be relative to many reasons, e.g., compiler optimizations. This also shows that, there is a lot of work to be done for real chip development ecosystem.

### SQL on real chip

In above memory benchmark, we see that the simple aggregation is ok on real chip. Here we do some more interesting SQL benchmarks.

1. Count with filtering

<p></p>
<div align="center">
<img class="center_img_wider" src="/img/2021-06-08-sql_on_riscv_in_rust/filtering_count.PNG"/>
</div>
<p align="center">Query: count with filtering</p>

In this query, we count the number of nyc taxi record in 2012 in the 100 million dataset. The result is terribly 44s. 

2. Group by

<p></p>
<div align="center">
<img class="center_img_wider" src="/img/2021-06-08-sql_on_riscv_in_rust/complex_query.PNG"/>
</div>
<p align="center">Boot TensorBase up from a SD card</p>

In this query, we count the number of nyc taxi record in every year in the 100 million dataset. The result is ridiculously 100s, which is 30x slower than that of x86 core. Considering we only use a single 1GHz core, it is seemly accepted. However, it is observed that we have not made fully optimizations on kernels for all arch-es, which is the next step we want to help with community. 

## Future

### RVV (RISC-V Vector Extension)

The uniqueness of T-Head C906 is that it is the first cheap enough and available real chip which has RVV support, although the implemented spec is 0.7.1 but not ratified 1.0. RVV and already available ARM's SVE is considered as a more friendly solution for compiler's auto-vectorization. For TensorBase and OLAP community, one big interesting work is how does the vector extension perform for accelerating data analytics. 

Obviously, rustc's riscv64gc-unknown-linux-gnu target does not support this vector extension. And more interesting thing is that several relative matured RISC-V simulation environments and VMs, e.g. QEMU, do not support the vector extension spec as well. This makes the prototyping works is a little challenging. One way is to build your own QEMU from the RISC-V maintained repo. We will show more how-tos in the future blog posts. 

### BeagleV

We are the friend of one RISC-V company StarFive, which is partnered with [beagleboard](https://beagleboard.org). Therefore, it is expected that [Beaglev](https://beagleboard.org/beaglev) as the next more performant and also affordable RISC-V computer will coming soon for our testing. It is also hoped to show some interesting results from SQL benchmark suites for the next coming evaluation.

## Join the Community

TensorBase believes that an infrastructure that can adapt to the era, like the Rust language itself, must be open source and innovative. Therefore, we are excited to make open source data warehouse happen on the top of "open source" hardware! 

Welcome to the [TensorBase community](https://github.com/tensorbase/tensorbase) to share your views and code, and to witness the thinking and iteration of the future data warehouse. We are a group of low level data and performance experts. In the [TensorBase community](https://github.com/tensorbase/tensorbase), we work with [Apache Arrow](https://github.com/apache/arrow-rs) and [Arrow DataFusion](https://github.com/apache/arrow-datafusion) with our own unique OLAP(Online Analytical Processing) innovations to build the next five years of the Rust big data ecosystem!

<p></p>

### [Comments in r/rust](https://www.reddit.com/r/rust/comments/nvy2oa/sql_on_riscv_chip_in_rust/)