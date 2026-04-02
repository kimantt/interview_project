package com.cs_study.interview.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.cs_study.interview.entity.UserEntity;

public interface UserRepository extends JpaRepository<UserEntity, Long>  {
	
	Optional<UserEntity> findByUsername(String username);
}
