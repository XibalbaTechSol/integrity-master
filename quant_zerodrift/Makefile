CXX = g++
CXXFLAGS = -std=c++17 -Wall -Wextra -O2 -pthread

all: main test_suite

main: main.cpp
	$(CXX) $(CXXFLAGS) -o main main.cpp

test_suite: test_main.cpp main.cpp
	$(CXX) $(CXXFLAGS) -o test_suite test_main.cpp

test: test_suite
	./test_suite

clean:
	rm -f main test_suite
