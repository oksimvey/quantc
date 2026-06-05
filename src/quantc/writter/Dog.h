#pragma once

#include "AbstractAnimal.h"
#include "Animal.h"

template<float weight>
class Dog : public Animal<weight>, AbstractAnimal<weight> {

};