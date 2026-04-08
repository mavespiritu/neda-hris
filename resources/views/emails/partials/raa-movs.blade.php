@php
    $files = collect(data_get($accomplishment, 'files', []));
@endphp

@if($files->isNotEmpty())
    <div style="margin-top: 8px; border-top: 1px solid #e5e7eb; padding-top: 8px;">
        <div style="font-size: 12px; font-weight: 600; color: #6b7280; margin-bottom: 6px;">
            MOVs
        </div>

        @foreach($files as $file)
            <div style="margin-bottom: 10px;">
                @if(!empty($file['is_image']) && !empty($file['inline_src']))
                    <div style="margin-bottom: 4px; font-size: 12px; color: #374151;">
                        {{ $file['name'] }}
                    </div>
                    <img
                        src="{{ $file['inline_src'] }}"
                        alt="{{ $file['name'] }}"
                        style="display:block; max-width: 100%; width: 100%; height: auto; border: 1px solid #e5e7eb; border-radius: 6px;"
                    />
                @else
                    <div style="font-size: 12px; color: #374151;">
                        <a href="{{ $file['url'] }}" style="color: #2563eb; text-decoration: underline;">
                            {{ $file['name'] }}
                        </a>
                    </div>
                    <div style="font-size: 11px; color: #6b7280; word-break: break-all;">
                        {{ $file['url'] }}
                    </div>
                @endif
            </div>
        @endforeach
    </div>
@endif
