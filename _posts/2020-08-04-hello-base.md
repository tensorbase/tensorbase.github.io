---
layout: post
title: "TensorBase: A modern engineering effort for taming data deluges"
date: 2020-08-04
---

Today, I am pleased to announce milestone 0 of [TensorBase](https://github.com/tensorbase/tensorbase) (called Base for short). 

Base is a modern engineering effort for building high performance and cost-effective bigdata analytics infrastructure with an open source culture. 

Base is written in the Rust language and its friend C.


## Philosophy
-------------

### First principle

Base is a project from the ["first principle"](https://en.wikipedia.org/wiki/First_principle). That is, unlike many other NoSQL/NewSQL products which claim to be based on [Google Spanner](https://en.wikipedia.org/wiki/Spanner_(database)) or similar, Base is based on almost **nothing** and built from the ground up. 

The first principle for Base is starting only from currently available commodities and software tools(a.k.a. languages and operation systems), and asks three questions: 

* (Dream #1) What limit can Base reach, facing the planetary tide of data?

* (Dream #2) What exciting community can build around Base?

* (Dream #3) How can Base grant the public the ability to control and harness big data?


### Shared Something

In the design of distributed data systems, there are two architectures often talked about: shared-nothing and shared everything. 

These are two extremes. Commonly, shared nothing is considered to be more scalable but, it is suboptimal or even bad for non-trivial problems. For a database like product, sharing nothing would be awkward. From a global operations viewpoint, it would most likely require the global movement of data. Then the remaining problem is what/which/how data to remove. Without sharing context and being ignorant of the environment it becomes impossible to achieve the global optimum.

OTOH, shared everything, in fact is idealized but unrealistic. Imagaine that we have a single big infinitely expandable computer. All our problems solved... but this isn't realistic. So, shared everything truly compromises on scalability and has requirements to hardware.

**Shared Something** is a dynamic best effort architecture sitting between shared nothing and everything, which achieves best performance via finitely sharing partial necessary contexts which are environment and computing dependent. This is just a highly abstract proposal and Base is still working on answering it. The direction to approach is, self adaptive computing via some shared infrastructures in the society of decentralization. Here, shared infrastructures do not mean centralized components. It could be just mechanisms to allow efficient information sharing/exchanging.  


### Architectural Performance 

Performance is one of core architectural designs. Long-years of experience with performance engineering taught me that if performance cannot be considered architecturally first, the final evolution results in the performance collapsing but that it cannot be repaired unless rewritten (but usually you have no chance to rewrite).

Scalability is another character often talked by projects. The truth is, good scalability does not mean high performance. Poor performance implementations are probably easier to achieve high scalability (in that you use a relative low baseline which may show no bottlenecks in any aspects). High scalability with low performance is cost expensive, economic killer and a high-carbon producer...

Via architectural performance design, with Dream #1 in mind, Base is unique.

## System

For short, the architectures are summarized in the following figure.

<p></p>
<div>
<img class="center_img" src="/img/2020-08-04-hello-base/system_diagram.png"/>
</div>
<p align="center">System sketch of TensorBase</p>
 
In this system, some parts are interesting, and some parts are indeed well-known (in regards to papers) but unfortunately no open-source counterpart exists.
 
One of core efforts of Base is to provide a **highly hackable system** for the community under the guidance of Dream #2. 

The system of Base is built with Rust and C. Rust lays a great base for system engineering. C is used to power a critical runtime kernel for read path(query) via a high-performance c jit compiler. 

The rationale for C is that Base needs a jit compiler for full performance (it is pity that recently I see some project say its ability to call vcl vectorized functions as a "fastest" database...). 

<p/>
By lowering the contributing bar, Base hopes more people can enjoy to engage in the community.

On the top of comfortable languages, the nature of "first principle" of Base, allows contributors to be more pleased to build elegant performance critical systems with the help of the excellent external tools. For instance, using modern Linux kernel's xdp in the network stack to enable a scalable and cost-efficient RDMA alternative on commodity network hardware (io_uring is that new standard tool in lower performance).

Note: storage and C jit compiler in the system are not released or released in binary form in the m0. They are under heavy changes but will come later. 


## Launch
---------

Let see what's in Base milestone 0.

In m0, Base provides a prototyping level but full workflow from the perspective of simple data analysis tools: 

1. command line tool: _baseops_
    * provides a subcommand _import_, to import csv data into Base
    * provides a subcommand _table_, to create a table definition

2. command line tool: _baseshell_
    * provides a query client (now the client is a monolithic to include everything)
    * m0 only supports query with single integer column type sum aggregation intentionally. 

<p/>
### Quick Start

let's do quick start:
1. run _baseops_ to create a table definition in Base
```bash
cargo run --bin baseops table create -c samples/nyc_taxi_create_table_sample.sql
```
Base explicitly separates write/mutation behaviors into the cli baseops. the provided sql file is just a DDL ansi-SQL, which can be seen in the [*samples* directory of repo]().

2. run _baseops_ to import [nyc_taxi csv dataset](https://clickhouse.tech/docs/en/getting-started/example-datasets/nyc-taxi/) into Base
```bash
cargo run --release --bin baseops import csv -c /jian/nyc-taxi.csv -i nyc_taxi:trip_id,pickup_datetime,passenger_count:0,2,10:51
```
Base's import tool uniquely supports importing csv partially into storage like above. Use help to get more info.

3. run _baseshell_ to issue query against Base
```bash
cargo run --release --bin baseshell
```
<p/>
### Benchmark 

New York Taxi Data is an interesting [dataset](https://clickhouse.tech/docs/en/getting-started/example-datasets/nyc-taxi/), it is a size fit for quickly benchmarking a real world dataset. It is often used in eye-catching promotional headlines, such as "query 1.xB rows in milliseconds". Now, we compare Base m0 against another OLAP DBMS [ClickHouse](https://en.wikipedia.org/wiki/ClickHouse)(20.5.2.7, got in July, 2020):

1. The Base csv import tool is vectorized. It supports raw csv processing at ~20GB/s in memory. The ~600GB 1.46 billion nyc taxi dataset importing run, saturates my two SATA raid0 (1GB/s) and finished in 10 minutes. ClickHouse ran at 600MB/s on the same hardware. 
    
    NOTE: ClickHouse does not support csv partial importing. So, the 600MB/s ClickHouse importing is done in a ClickHouse favored way, by using a column-stripped csv. 600GB for Base is much larger than a node's memory, but the size of column-stripped csv for ClickHouse is memory-fit (and the cacheline is fully utilized). The official report states that ClickHouse on 8-disk raid5 takes [76 minutes to finish](https://clickhouse.tech/docs/en/getting-started/example-datasets/nyc-taxi/).

2. for the following simple aggregation, 
    ```sql
select sum(trip_id-100)*123 from nyc_taxi
    ```

    **Base m0 is 6x faster than ClickHouse (20.5.2.7)**: Base runs in ~100ms, ClickHouse runs in 600ms+. 

<p></p>
<div>
<img class="center_img_wider" src="/img/2020-08-04-hello-base/base_m0.png"/>
</div>
<p align="center">Aggregation results in Base's baseshell</p>

<p></p>
<div>
<img class="center_img_wider" src="/img/2020-08-04-hello-base/clickhouse_20527.png"/>
</div>
<p align="center">Aggregation result in ClickHouse client</p>

Note #1: The [official ClickHouse configs](https://clickhouse.tech/docs/en/getting-started/example-datasets/nyc-taxi/) are used. The bench test runs several times, and uses the best result for ClickHouse. (This is just an in-memory query on the same hardware, no actual disk io is involved and the ClickHouse results are on par with [officially listed single node result](https://clickhouse.tech/docs/en/getting-started/example-datasets/nyc-taxi/)).

Note #2: It is interesting to see a bug in Base's jit compiler; it is expected that the second run of kernel should be shorter than the first run.

Note #3: For showing the version of ClickHouse, the figure just picks the first run screenshot after client login. This does not affect the results, in that ClickHouse is in the server-client arch.

Here, what I want to emphasize is that the performance of Base on a trivial case is almost hitting the ceiling of single six-channel Xeon SP. That is because the parallel summation is just a trivial memory bandwidth benchmarking loop. There is still room for some tiny improvements, so stay tuned: 
* ~15ms of current jit compilation (not trivial, after the bug fix, an extra 15-20ms saving);
* 10-20ms of current naive parallel unbalancing (trivial for just fixing, not trivial for architectural elegance); 

<p/>
Although Base m0 just gives a prototype, it is **trivial** to expand to all other single table operations in hours. Welcome to the Base community!


## Meeting the Community
-----------------------

The true comparison is that, thanks to the appropriate ideologies (not only first principle...year-after-year experiences, practices, thoughts) and tools (Rust and C...), in two-months Base can already crush four-year ClickHouse on performance for these simple starting metrics.

Base is ambitious: from storage, to sql compilation, to mixed analytics load scheduling, to client, to performance engineering, to reliability engineering, to ops engineering and to security and privacy. Take a glimpse:

1. Base invents in a data and control unified linear IR for SQL/RA (I called "sea-of-pipes").
2. Base favors a kind of high level semantic keeping transforms from IR to C which provide lighting fast, easily maintainable code for generations. 
3. Base supports writting C in Rust via proc_macro and in the future it is not hard to provide an in-Rust-source error diagnoses and debugging experiences. OTOH, this allows to use any Rust logics to generate arbitrary C templates.
4. Base is prototyping a new tiered compilation which sunshines in short-time queries compared to other open-source LLVM IR based counterparts.
5. ...

<p/>
If you are from Rust or C communities, please [give Base a star](https://github.com/tensorbase/tensorbase). This helps Base build a strong community voice: where we can build the best bigdata analytics infrastructure on the planet.

If you are having some of the same dreams which Base has and want to work together with us data nerds, [Join us!](https://github.com/tensorbase/tensorbase) 
