<?php

namespace App\Support;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder as EloquentBuilder;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class IndexTableQuery
{
    protected EloquentBuilder|Builder $query;

    protected array $allowedSorts = [];
    protected array $allowedFilters = [];
    protected $searchHandler = null;

    /** @var null|callable(Collection $items, Request $request): Collection */
    protected $decorator = null;

    protected string $defaultSortColumn = 'id';
    protected string $defaultSortDirection = 'desc';

    public function __construct(EloquentBuilder|Builder $baseQuery)
    {
        $this->query = $baseQuery;
    }

    public static function for(EloquentBuilder|Builder $baseQuery): self
    {
        return new self($baseQuery);
    }

    public function allowedSorts(array $sorts): self
    {
        $this->allowedSorts = $sorts;
        return $this;
    }

    public function allowedFilters(array $filters): self
    {
        $this->allowedFilters = $filters;
        return $this;
    }

    public function search(?callable $handler): self
    {
        $this->searchHandler = $handler;
        return $this;
    }

    /**
     * Decorate (mutate/append fields) for the CURRENT PAGE items before in-memory sorting.
     * Signature: fn(Collection $items, Request $request): Collection
     */
    public function decorate(?callable $decorator): self
    {
        $this->decorator = $decorator;
        return $this;
    }

    public function defaultSort(string $column, string $direction = 'desc'): self
    {
        $this->defaultSortColumn = $column;
        $this->defaultSortDirection = strtolower($direction) === 'asc' ? 'asc' : 'desc';
        return $this;
    }

    public function apply(Request $request): self
    {
        // 1) Filters
        foreach ($this->allowedFilters as $key => $filter) {
            if (!$request->filled($key)) continue;

            $value = $request->input($key);

            if (is_callable($filter)) $filter($this->query, $value, $request);
            else $this->query->where($filter, $value);
        }

        // 2) Search (optional)
        $term = trim((string) $request->input('search', ''));
        if ($term !== '' && is_callable($this->searchHandler)) {
            ($this->searchHandler)($this->query, $term, $request);
        }

        // 3) DB sort only (in-memory handled in paginate())
        $sort = (string) $request->input('sort', '');
        $direction = strtolower((string) $request->input('direction', 'asc')) === 'desc' ? 'desc' : 'asc';

        if ($sort !== '' && array_key_exists($sort, $this->allowedSorts)) {
            $sortSpec = $this->allowedSorts[$sort];

            // Only apply DB sort if it's a column/expression string
            if (is_string($sortSpec)) {
                $this->query->orderBy($sortSpec, $direction);
            }
        } else {
            $this->query->orderBy($this->defaultSortColumn, $this->defaultSortDirection);
        }

        return $this;
    }

    public function paginate(Request $request, int $perPage = 20): LengthAwarePaginator
    {
        $paginator = $this->query->paginate($perPage)->withQueryString();

        // A) Decorate current page items first
        if (is_callable($this->decorator)) {
            $items = $paginator->getCollection();
            $items = ($this->decorator)($items, $request);

            if ($items instanceof Collection) {
                $paginator->setCollection($items->values());
            }
        }

        // B) Then apply in-memory sort if requested and sortSpec is callable
        $sort = (string) $request->input('sort', '');
        $direction = strtolower((string) $request->input('direction', 'asc')) === 'desc' ? 'desc' : 'asc';

        if ($sort !== '' && array_key_exists($sort, $this->allowedSorts)) {
            $sortSpec = $this->allowedSorts[$sort];

            if (is_callable($sortSpec)) {
                $items = $paginator->getCollection();
                $sorted = $sortSpec($items, $direction, $request);

                if ($sorted instanceof Collection) {
                    $paginator->setCollection($sorted->values());
                }
            }
        }

        return $paginator;
    }
}
