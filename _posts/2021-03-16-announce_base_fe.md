---
layout: post
title: "TensorBase Frontier: 5x ~ 10000x Faster Drop-in Replacement or Accelerator For ClickHouse in Rust"
date: 2021-03-16
---

## Announcement
TensorBase is proud to announce that, today the alpha plan of Frontier Edition is officially available. TensorBase Frontier Edition alpha is a 5x ~ 10000x drop-in replacement or accelerator for ClickHouse. 

Watch the [alpha demo here](/#demo). Welcome to join in the [alpha plan here](/#alpha). 

## "Billions of rows per second" as Low Bar

You may see that some databases claim they can aggregate ["billions of rows per second"](https://www.google.com/search?q=billion+rows+per+second). The truth is that, their "billions of rows" aggregations can be done in ~40 milliseconds on a modern socket as shown in TensorBase. 

Let's start the journey of benchmark!

#### Round 1 - Architecture Gap

* Dataset: 1000,000,000,000 (1 Trillion or 1000 Billion) natural numbers

|Query |ClickHouse (v21.2.5.5)      | TensorBase FE (2021.3.0.a)  | Speedup Ratio of TB FE  |
|:----:|:---------------------------:|:-----------------------: | :--------------------------: |
|SELECT sum(number) FROM system.numbers | 28.6 sec / 279.4 GB/s   |  0.027 sec / ~ | 1059x |
|SELECT max(number) FROM system.numbers | 51.9 sec / 154.0 GB/s   |  0.027 sec / ~ |  1922x |
|SELECT max(123 * number+456 * number+789 * number) FROM system.numbers | 303.363 sec / 26.37 GB/s |  0.028 sec / ~ | 10833x |

<p></p>
In ClickHouse, system.numbers is a kind of virtual table to represent the natural number dataset. The measurements for system.numbers/numbers_mt makes no senses for the real world, but still uncovers the unique of TensorBase.

In the above benchmark, TensorBase FE's "count"/"sum" and even complex "sum" are small constants, which ridiculously 1000x to 10000x faster than that of ClickHouse. For this case, the speed ratio of TB to CH is quasi-infinite. This is true. Because TensorBase FE's JIT compiler does the smart constant time compilation for that interval-predefined loop. On the contrary, as the complexity of the expression increases a little, the performance degrades sharply in ClickHouse.

This is an excellent demo of modern compilation technology to data analysis, which can not done in the volcano model of common open source OLAP databases. 

This is also a great example of the performance gap caused by the architecture gap. We have entered the post-Moor era. [**Architectural performance**](/2020/08/04/hello-base.html) is one of core methodologies from TensorBase for the post-Moore era. More about TensorBase's methodologies have been cooked [here presentations](/about) and [source codes](https://github.com/tensorbase/tensorbase/tree/m0). 

Note: attentive readers may still be interested in that 27 mill-seconds overhead(the TensorBase guy calls it, "uncore" cost, a.k.a., cost on parsing/optimization/scheduling...). This overhead can be reduced to 3 milliseconds or so for special cases and shown in the following real world "count" benchmark. 

#### Round 2 - Real World Bigdata

<p></p>
<div align="center">
<img class="center_img_wider" src="/img/2021-03-16-announce_base_fe/comparison_on_end_to_end_query_time.svg"/>
</div>
<p align="center">Comparison On End-to-end Query Time</p>

Here, the NYC taxi 1.47 billion dataset is used. The alpha release of TensorBase supports main operations on single table. Four kinds of single-table queries are compared:
* Q#1: simple count
* Q#2: a little complex sum
* Q#3: simple two-column aggregation
* Q#4: simple group by 
* Q#5: a little complex group by

More detailed benchmark infos could be seen in [the project](https://github.com/tensorbase/tensorbase_frontier_edition).

On the surface, the end-to-end query time of TensorBase is 1/4.5 to 1/31 of that of ClickHouse.

The deeper conclusion is more profound: **TensorBase has almost reached a certain limit in the context of theory or actual hardware**. This not only means that it is the fastest, but also means that (almost) no other implementations can be faster (in the same context). 

The so called "limit" is memory bandwidth, in that most bigdata analysis is memory bound. The memory bandwidth utilization is a more general and useful measurement across different machines.


<p></p>
<div align="center">
<img class="center_img_wider" src="/img/2021-03-16-announce_base_fe/comparison_on_bandwidth.svg"/>
</div>
<p align="center">Comparison On Bandwidth Usage</p>

Here, as example, the end-to-end bandwidth of Q#2 and Q#4 is shown, which is calculated by (queried dataset size)/(query time). 

Let's talk about Q#2 firstly. For the end-to-end bandwidth of Q#2 in ClickHouse is 6.5 GB/sec, while that in TensorBase is 81.4 GB/sec. If only consider the execution of the query core, that is, if omit the "uncore" cost, the core bandwidth is 95 GB/sec, which is calculated by (queried dataset size)/(query time - "uncore" time). The node is setup with 6-channel DDR4-2400 REG ECC DRAMs, its measured practical max bandwidth (by Intel VTune) is just 100 GB/sec. That is, TensorBase achieves 95% core memory bandwidth utilization in this case. Memory wall hit!


#### How High is the Sky?

Note, Q#2 is a complex sum (at least with predicate). For a simple count/sum, it is naive to hit the memory wall (but unfortunately the result of current ClickHouse still far from this). 

How about more complex group-by? See Q#4: the end-to-end bandwidth of Q#4 in TensorBase FE is 66.6 GB/sec, of which the core bandwidth is 80 GB/sec. TensorBase FE achieves 80% core memory bandwidth utilization in this datetime involved group-by! 

TensorBase FE is the first product to claim that it can run kinds of group-by queries in almost the same speed as non group-by aggregation queries in the modern CPU. This is non-trivial.

Furthermore, TensorBase wants to answer a question: how high is the sky? or where is the performance limit of bigdata analysis? It deserves more stories, and TensorBase invites you [into the journey](/community) for that more.


## Rust Powered

People may have a question: why does TensorBase use Rust to write its system? Why not just stand on the shoulders of C++ implementations? It is true that, a good engineer can use any language to complete any engineering. But,

* A good engineer will not being pleasured in using any language
* It is not a good engineering only relying on good engineers

#### Constrained Programming Model is Engineering Paradigm Revolution

I played with ClickHouse monthly, I met three no warning crashes in-between simple but gigabyte ingestions, queries. This is a normal C++ project experience. But it is unnecessarily normal for the modern engineering.

In TensorBase FE, there is no crash with 256 concurrent request multi-threading stress. Also in TensorBase FE, there is no crash after TB level data have been ingested day by day from day 1 of storage layer ready till now. In TensorBase, such a confidence has been established: unbreakable solid after the compilation pass.

This era also urgently needs new engineering paradigm. Rust is actually setting off an engineering paradigm revolution. The explicitly constrained programming model of Rust eliminates potential security risks before production runs. TensorBase's methodologies can only be thoroughly embodied by Rust. 

TensorBase does not compromise on the beauty of engineering when pursuing ultimate performance. And, as you seen, the experience from TensorBase shows that, with the help of Rust, both can be greatly achieved!


## Economics And Sociology of Data Warehouse

This topic deserves to be covered in dedicated articles. 10x performance improvement is not just 10x cost reduction. On the other hand, the cost of bigdata analysis is much high and becoming higher nowadays. This makes that ordinary individuals are hard to benefit from the bigdata. Furthermore, a well thought and engineered infrastructure can not only benefit its users but also help the operations of whole society.

## Open Source Dilemma For Small

The founder of TensorBase hopes the project can help all common people and businesses in this era to understand and benefit from the bigdata unique to this era. But he is just one person. If a big giant open sources a project, it has enough resources to control the project grown under its designed path. This obviously does not hold for small individuals and startups. Recent [elasticsearch relicensing](https://www.google.com/search?q=elastic+relicensing) is just one of new examples, but won't be the last.

TensorBase's thoughts are divided into following three aspects:

#### Open source Base Edition

TensorBase splits the performance insensitive part into the APLv2 based open source [Base Edition (a.k.a., TensorBase BE)](https://github.com/tensorbase/tensorbase). As you seen, many open source projects have done in OLAP fields. TensorBase BE may explore different paths, for example, fully Rust, modular/pluggable/embeddable designs(thinking an OLAP version SQLite in Rust), and modern high performance components in Rust. 

TensorBase BE is still in its early stage, and welcome any idea.

#### Free binary distribution from beta

See plan in the [website here](/#beta).

#### Enterprise Collaboration Source Plan (ECSP)

See plan in the [website here](/#ecsp).


## ClickHouse Compatible

TensorBase is the friend of ClickHouse. Although the performance of TensorBase beats ClickHouse by orders of magnitude, ClickHouse still provides more flexibilities which developers like over other OLAP implementations. TensorBase highly values ClickHouse as an commercial-friendly open source data warehouse solution, although disagrees with ClickHouse's technical route.

TensorBase contributes values to whole ClickHouse ecosystem via the communication protocol compatibility. TensorBase supports mixed deployments with ClickHouse. Users in ClickHouse ecosystem can freely choose one or both. If you want fastest responses, ask TensorBase. If you want more features which are not supported by TensorBase, query to ClickHouse with in the same client/driver/frontend.

More infos about current compatibilities to ClickHouse could be seen in the [project page](https://github.com/tensorbase/tensorbase_frontier_edition).

## Near Future

In this alpha announcement, a solid foundation has been demonstrated. The beta version is coming soon in months. Besides joins, more performance and several key features for production will be shipped in beta.

Finally, as the founder of TensorBase, I again invites any who agrees with TensorBase's visions to join in. [Enterprise Collaboration Source Plan](/#ecsp) is just one of that designed ideas to assist in this process. TensorBase has an open source bigdata infrastructure dream in its blood. I am optimistic about this.

If you are interested or willing to help, don't hesitate to <a href="/community">join the community</a> or <a href="mailto:jin@tensorbase.io">drop me a message</a>.



### [Comments in HN](https://news.ycombinator.com/item?id=26487416)

### [Comments in r/rust](https://www.reddit.com/r/rust/comments/m6utn8/show_rrust_tensorbase_frontier_5x_10000x_faster/)