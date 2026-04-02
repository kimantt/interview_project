package com.cs_study.interview.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cs_study.interview.entity.CategoryEntity;

public interface CategoryRepository extends JpaRepository<CategoryEntity, Long> {

}
