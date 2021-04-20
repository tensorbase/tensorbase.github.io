---
layout: post
title: "TensorBase Reload: New ClickHouse in Rust on the Top of Apache Arrow and DataFusion"
date: 2021-04-20
---

## TensorBase Reload
After the latest announcement, TensorBase got many helps from kinds of fields. We decide to collaborate to wider open source community in Rust.

The first of efforts is that, we rebase the TensorBase on the top of Apache Arrow and DataFusion. From the overall bigdata analysis blueprint, we share common foundations. TensorBase fully supports Apache Arrow and DataFusion to be the next generation core of data foundations in Rust.  


## Hands-on

We are proud that an out-of-the-box experience has been provided from today now. You just use the ClickHouse client to work against with TensorBase, which likes a simplified version of ClickHouse server.

<p></p>
<div align="center">
<img class="center_img_wider" src="/img/2021-04-20-base_reload/play_out_of_the_box.gif"/>
</div>
<p align="center">Get started live recording</p>

Just try it yourself [on the project](https://github.com/tensorbase/tensorbase).

## Benchmarks

A simple benchmark on real-world NYC Taxi dataset has been exercised ([details](https://github.com/tensorbase/tensorbase/blob/main/docs/benchmarks.md)):

|Query |ClickHouse (v21.2.5.5)      | TensorBase (main branch)  | Speedup Ratio of TB   |
|:----:|:---------------------------:|:-----------------------: | :--------------------------: |
| select sum(trip_id) from trips_lite | 0.248 sec  |  0.079 sec | 3.1 (TB is faster) |
| select date_part('year',pickup_datetime), count(1) from trips_lite group by date_part('year',pickup_datetime)* | 0.514 sec |  3.375 sec  | 0.15 (TB is slower)  |

<p></p>

In summary, for query, TensorBase is faster in the simple aggregation, but soon slower in more complex cases. There is still a great start!


For data ingestion, TensorBase has a novel storage design and more excellent concurrent server than ClickHouse. 2x speedup in ingestion time is found in the Rust driver based bench. But the performance bottleneck seems at the client side. So the advantage of TensorBase is not evident. 

It is hoped that more dedicated tools could be introduced to help end users at the data transportation. This is very important for users recovery and even for queries in the future.

## Relationship with DataFusion

TensorBase is designed as an end-to-end big data warehouse, which is different to that of DataFusion. Furthermore, different ideas in the fields of storage, scheduling or something else may be explored in TensorBase. 

As performance guys, TensorBase hopes to continue to help the DataFusion to improve in this side. The appropriate changes to DataFusion will be submitted back to it. And interesting changes which are not appropriate to submit immediately will be notified and shared with the DataFusion community. 

From the side of TensorBase, it is open for all kinds of collaborations.

## Join the community

The current completeness on single node is high. There are tons of interesting and meaningful works to carry out from now. For example,

* Enable several uncompleted types 
* Distributing query on top of DataFusion Ballista
* High-performance UDFs on top of [lightjit](https://github.com/tensorbase/tensorbase/tree/main/crates/lightjit)

Yes, a plenty of document works are also needed to elaborate more detailed internal mechanisms to guide more newcomers. The good thing is that, the source is out with good engineering cares IMHO. You are invited to [come into the community](https://github.com/tensorbase/tensorbase) to discuss anything and hopefully wonderful outcomes would be inspired and created for all community people. 

Waiting for you!

<p></p>

### [Comments in r/rust](https://www.reddit.com/r/rust/comments/mupu31/tensorbase_reload_new_clickhouse_in_rust_on_the/)

### [Comments in HN](https://news.ycombinator.com/item?id=26873816)