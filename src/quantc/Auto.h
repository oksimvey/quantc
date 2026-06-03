#pragma once

#include <cstddef>
#include <string>
class Auto {

  std::byte *var;

public:
  Auto(std::byte *var) : var(var) {}

  Auto(const auto &variable)
      : Auto(const_cast<std::byte *>(static_cast<const std::byte *>(
            static_cast<const void *>(&variable)))) {}
};