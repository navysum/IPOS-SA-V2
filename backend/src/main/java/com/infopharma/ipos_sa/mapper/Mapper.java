package com.infopharma.ipos_sa.mapper;

public interface Mapper<A,B> {

    B mapTo(A a);

    A mapFrom(B b);

}