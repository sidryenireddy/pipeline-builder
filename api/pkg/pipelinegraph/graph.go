package pipelinegraph

import "fmt"

type Node struct {
	ID string
}

type Edge struct {
	Source string
	Target string
}

type Graph struct {
	Nodes map[string]*Node
	Edges []Edge
}

func New() *Graph {
	return &Graph{Nodes: make(map[string]*Node)}
}

func (g *Graph) AddNode(id string) {
	g.Nodes[id] = &Node{ID: id}
}

func (g *Graph) AddEdge(source, target string) {
	g.Edges = append(g.Edges, Edge{Source: source, Target: target})
}

func (g *Graph) TopologicalSort() ([]string, error) {
	inDegree := make(map[string]int)
	adjacency := make(map[string][]string)

	for id := range g.Nodes {
		inDegree[id] = 0
		adjacency[id] = nil
	}

	for _, e := range g.Edges {
		adjacency[e.Source] = append(adjacency[e.Source], e.Target)
		inDegree[e.Target]++
	}

	var queue []string
	for id, deg := range inDegree {
		if deg == 0 {
			queue = append(queue, id)
		}
	}

	var order []string
	for len(queue) > 0 {
		node := queue[0]
		queue = queue[1:]
		order = append(order, node)
		for _, neighbor := range adjacency[node] {
			inDegree[neighbor]--
			if inDegree[neighbor] == 0 {
				queue = append(queue, neighbor)
			}
		}
	}

	if len(order) != len(g.Nodes) {
		return nil, fmt.Errorf("pipeline contains a cycle")
	}

	return order, nil
}
