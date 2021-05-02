---
layout: post
title: "TensorBase Book Series 1: Introduction" 
date: 2021-05-01
---


## What is TensorBase

This is an era in which data is generated in massive amounts, but individuals and most companies in our era do not have a good infrastructure to discover the value of these massive amounts of data. TensorBase, starting from a modern new perspective, uses an open source culture and method to rebuild a real-time data warehouse under Rust to serve the data storage and analysis in this era of massive data.

## Advantages of TensorBase

1. All in Rust. 
  
    No need to repeat well-known all kinds of advantages of Rust. TensorBase believes that Rust is a programming paradigm revolution in systems engineering. The paradigm revolution provides us with an opportunity to use new tools and methods to build a new infrastructure platform. As the "touchstone" of the system language database software, Rust should not be absent. TensorBase has experienced dozens of terabytes of data injection in daily tests. It is currently the most comprehensive data warehouse project in the Rust community that is deeply optimized for users, especially small and medium-sized enterprises.

2. Out of the box. 
  
    TensorBase already supports the complete data warehouse process from data insertion or import to query, and has a high degree of early completion. From the moment you see this article, you can download the binary files in the relevant Linux environment from the Release page of TensorBase and try it out. (Windows 10’s WSL2 should also be available now, feedback is welcome!)

3. ClickHouse protocol compatible. 
    
    ClickHouse, as a data warehouse written in C++, has been used by many companies at home and abroad. TensorBase uses Rust language to implement a high-performance ClickHouse SQL dialect parser and TCP communication protocol stack from the ground up. ClickHouse TCP client can seamlessly connect to TensorBase. So, if you have experience in using ClickHouse, you can use TensorBase with zero learning cost. Even if you haven't used ClickHouse, you can easily find relevant learning materials, which allows you to easily enter TensorBase.

4. Performance first. 

    TensorBase expects to realize the full potential of modern hardware through new software and system design. TensorBase implemented "F4" on the core link code for the first time: Copy-free, Lock-free, Async-free, Dyn-free (no dynamic object distribution). [Preliminary performance evaluation] (https://github.com/tensorbase/tensorbase#benchmarks) shows: On the 1.47 billion-row New York taxi data set, TensorBase's simple query performance has led ClickHouse. Of course, there is still a gap between TensorBase and ClickHouse in terms of complex queries, but this is exactly what our open source community wants to promote.

5. Simplify the complexity.

    The current big data system is very complicated to use. Even if you want to run the simplest system, you need to configure a large number of incomprehensible parameters or install a large number of third-party dependencies.
      + For users, in addition to the out-of-the-box use that has been reached now, TensorBase hopes that the system can run autonomously during runtime, rather than relying on operation and maintenance administrators.
      + For developers, TensorBase hopes to lower the contribution threshold. The overall project architecture design is simple and efficient (see later for more information), with few external dependencies, and the stand-alone time for a complete recompilation (cargo clean to cargo build) is within 1 minute. (The complete construction time of a big data system or C++ database is often measured in hours.)

6. Connected future. 
    
    TensorBase transforms Apache Arrow and DataFusion at the core, seamlessly supporting Arrow format query, analysis and transmission. Arrow format, as an increasingly widely used big data exchange intermediate format, has been supported by multiple databases and big data ecological platforms. TensorBase is compatible with Arrow on the engine. In the future, it can support both cloud-native and cloud-neutral data warehouse experiences and provide storage-neutral data lake services.


## Architecture of TensorBase

<p></p>
<div align="center">
<img class="center_img_wider" src="https://user-images.githubusercontent.com/237573/115341887-efeb0a00-a1db-11eb-8aea-0c6cef2ba1ca.jpg"/>
</div>
<p align="center">TensorBase overall architecture</p>

* Base Server

    TensorBase service interface layer. Provide external data interface services, such as data writing and query entry. TensorBase creatively implements the world's first non-C++ ClickHouse TCP protocol service stack, which can support ClickHouse client (clickhouse-client command line) and direct connection driven by native protocol language. At the same time, Base Server is the first async-neutral Rust high-performance server. Based on the modified Actix event loop, Base Server does not use async at all in the implementation of the service. While providing excellent debuggability, the evaluation performance also greatly exceeds the implementation based on tokio's default async expression layer. In the future, non-tokio network io layer implementation can be introduced.

* Base Meta/Runtime/Storage

    The metadata layer, runtime layer and storage layer of TensorBase. At the storage layer, TensorBase is non-classical columnar storage. The most important of these, we have given an anti-gravity design: No LSM. We no longer use the LSM Tree (Log Structured Merge Tree) data structure that is currently popular in open source databases and big data platforms. Instead, it uses a data structure that we call Partition Tree. The data is directly written to the partition file. While maintaining the append only write performance, it avoids the subsequent compact overhead of the LSM structure. Thanks to the support of the modern Linux kernel and smart writing design, we do not use any locks (Lock-free) on the user-space core read-write path, which maximizes the high-concurrency network service layer The provided capabilities can provide ultra-high-speed data writing services.


* Base Engine

    The engine layer of TensorBase. TensorBase uses the modified Apache Arrow and DataFusion, and creatively adapts the underlying storage to the Arrow format to achieve Zero Copy data query. Of course, the current adaptive storage strategy is only a sub-optimal solution in progress. TensorBase will continue to iterate on the storage layer in the future to provide more optimizations that keep pace with the times. At the same time, TensorBase will further optimize to help the Arrow/DataFusion community optimize the performance of its query engine and grow with the community.

* Others

    TensorBase also has some basic components, such as,
    * base, common tool library;
    * lang, language layer (Currently, it mainly implements a ClickHouse compatible parsing and presentation layer).
    * lightjit, a class expression JIT engine, can be extended to the high-performance, safe and controllable user-defined function UDF (User Defined Functions) layer in the future.

    TensorBase will further develop and open its own high-performance infrastructure in the future, and contribute some unique high-performance reusable infrastructure to the Rust community.

    Finally, the dotted line connection in the architecture diagram has not yet been implemented, this is a panoramic architecture blueprint of TensorBase.


## Progress of TensorBase

<p></p>
<div align="center">
<img class="center_img_wider" src="https://user-images.githubusercontent.com/237573/115368682-e5d80400-a1f9-11eb-9a9e-deeb4d5d58d2.gif"/>
</div>
<p align="center">TensorBase Out-of-the-box Demo</p>

As shown in the figure above, TensorBase can already provide a stand-alone data warehouse service out of the box, and feedback is welcome.

In the next few days, we will complete the storage layer support required to pass the TPC-H evaluation and provide preliminary TPC-H test results.

The recent road map includes the following interesting directions:

1. Distributed cluster.
Based on Ballista of DataFusion, it is easy to implement a simple (semi-manual) distributed cluster solution like ClickHouse. However, we take this as the beginning. TensorBase hopes to provide new thinking and direction to make distributed query simple and efficient, easy to develop and maintain.
2. The storage layer is enhanced. Introduce advanced options such as primary keys.
3. Arrow and Data Fusion query kernel performance improvements.
4. ClickHouse HTTP communication protocol and other query front-end enhancements.
5. Stand-alone reliability enhancement.


## Join the Community

TensorBase believes that an infrastructure that can adapt to the times, like the Rust language itself, must be open source and innovative. 

Welcome to the [TensorBase community](https://github.com/tensorbase/tensorbase) to share your views and code, and to witness the thinking and iteration of the future data warehouse.


TensorBase will launch more series of articles in order to give everyone a deeper understanding of the project and the use of the Rust language in the project. All interested friends are also welcome to participate in the open source project.

Join the [TensorBase community](https://github.com/tensorbase/tensorbase) and build the next five years of the Rust big data ecosystem!