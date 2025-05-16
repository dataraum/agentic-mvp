<script>
	import {
		SvelteFlow,
		Background,
		Controls,
		MiniMap,
		Position,
		ControlButton
	} from '@xyflow/svelte';
	import dagre from '@dagrejs/dagre';
	import DataFile from '$lib/ui/canvas/table-node/data-file.svelte';
	import Query from '$lib/ui/canvas/query-node/query.svelte';
	import { resetGraph, getNodes, setNodes, getEdges, setEdges } from '$lib/ui/canvas/index.svelte';
	import { CloseCircleSolid, ExpandOutline, TrashBinOutline } from 'flowbite-svelte-icons';
	import '@xyflow/svelte/dist/style.css';
	import ErrorView from '../view/error-view.svelte';
	import ButtonDials from './button-dials.svelte';
	import { deleteItAll } from '$lib/persist/surreal/queries-api';
	import { updatePosition } from '$lib/persist/surreal';

	/** @type {import('@xyflow/svelte').NodeTypes} */
	const nodeTypes = {
		// @ts-ignore
		dataNode: DataFile,
		// @ts-ignore
		queryNode: Query
	};

	function doLayout() {
		const dagreGraph = new dagre.graphlib.Graph();
		dagreGraph.setDefaultEdgeLabel(() => ({}));
		dagreGraph.setGraph({ rankdir: 'TB' });

		const nodes = getNodes();
		const edges = getEdges();
		nodes.forEach((node) => {
			if (node.measured && node.measured.width && node.measured.height) {
				dagreGraph.setNode(node.id, { width: node.measured.width, height: node.measured.height });
			}
		});

		edges.forEach((edge) => {
			dagreGraph.setEdge(edge.source, edge.target);
		});

		dagre.layout(dagreGraph);

		nodes.forEach((node) => {
			const nodeWithPosition = dagreGraph.node(node.id);
			node.targetPosition = Position.Top;
			node.sourcePosition = Position.Bottom;

			if (node.measured && node.measured.width && node.measured.height) {
				node.position = {
					x: nodeWithPosition.x - node.measured.width / 2 + 50,
					y: nodeWithPosition.y - node.measured.height / 2 + 70
				};
			}
		});

		storeUpdateNodesSync(nodes);

		// should... trigger a redraw in xyflow
		// setNodes(nodes);
		window.location.reload();
	}

	async function resetLocalData() {
		await navigator.storage
			.getDirectory()
			.then((opfsRoot) => opfsRoot.removeEntry('data', { recursive: true }))
			.then(() =>
				deleteItAll().then(() => {
					resetGraph();
					window.location.reload();
				})
			);
	}

	/**
	 * @param {import("@xyflow/svelte").Node[]} nodes
	 */
	async function storeUpdateNodesSync(nodes) {
		for (const node of nodes) {
			await storeNodePosition(node);
		}
	}

	/**
	 * @param {import("@xyflow/svelte").Node} node
	 */
	async function storeNodePosition(node) {
		switch (node.type) {
			case 'queryNode':
				await updatePosition('queries', node.position, node.id);
				break;
			case 'dataNode':
				await updatePosition('data', node.position, node.id);
				break;
		}
	}

	/**
	 * @param {{ targetNode: any; nodes?: import("@xyflow/svelte").Node[]; event?: MouseEvent | TouchEvent; }} e
	 */
	async function persistNodePositionAfterDrag(e) {
		storeNodePosition(e.targetNode);
	}
</script>

<div class="overview h-full" style="height: 100vh;">
	<SvelteFlow
		bind:nodes={getNodes, setNodes}
		bind:edges={getEdges, setEdges}
		{nodeTypes}
		onnodedragstop={(e) => persistNodePositionAfterDrag(e)}
	>
		<ButtonDials />
		<ErrorView />
		<Background />
		<Controls>
			<ControlButton title="shuffle layout" onclick={() => doLayout()}>
				<ExpandOutline />
			</ControlButton>
			<ControlButton title="reset everything" onclick={() => resetLocalData()}>
				<TrashBinOutline />
			</ControlButton>
			<ControlButton title="logout" onclick={() => (location.pathname = '/logout')}>
				<CloseCircleSolid />
			</ControlButton>
		</Controls>
		<MiniMap zoomable pannable height={120} />
	</SvelteFlow>
</div>
