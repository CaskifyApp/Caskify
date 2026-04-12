import { useState } from 'react';
import { FileCode, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QueryTemplatesProps {
  onSelectTemplate: (template: string) => void;
}

const TEMPLATES = [
  {
    category: 'SELECT',
    items: [
      { name: 'Select All', template: 'SELECT * FROM table_name LIMIT 100;' },
      { name: 'Select with WHERE', template: "SELECT * FROM table_name WHERE column_name = 'value';" },
      { name: 'Select with JOIN', template: 'SELECT a.*, b.column_name\nFROM table_a a\nJOIN table_b b ON a.id = b.a_id\nWHERE a.active = true;'},
      { name: 'Select with Aggregation', template: 'SELECT column_name, COUNT(*) as count\nFROM table_name\nGROUP BY column_name\nORDER BY count DESC;'},
    ],
  },
  {
    category: 'INSERT',
    items: [
      { name: 'Insert Single Row', template: "INSERT INTO table_name (column1, column2)\nVALUES ('value1', 'value2');" },
      { name: 'Insert with RETURNING', template: "INSERT INTO table_name (column1, column2)\nVALUES ('value1', 'value2')\nRETURNING *;" },
      { name: 'Insert Multiple Rows', template: "INSERT INTO table_name (column1, column2)\nVALUES\n  ('value1', 'value2'),\n  ('value3', 'value4'),\n  ('value5', 'value6');" },
    ],
  },
  {
    category: 'UPDATE',
    items: [
      { name: 'Update Single Column', template: "UPDATE table_name\nSET column_name = 'new_value'\nWHERE id = 1;" },
      { name: 'Update Multiple Columns', template: "UPDATE table_name\nSET column1 = 'value1', column2 = 'value2'\nWHERE id = 1;" },
      { name: 'Update with RETURNING', template: "UPDATE table_name\nSET column_name = 'new_value'\nWHERE id = 1\nRETURNING *;" },
    ],
  },
  {
    category: 'DELETE',
    items: [
      { name: 'Delete with WHERE', template: 'DELETE FROM table_name\nWHERE column_name = \'value\';' },
      { name: 'Delete with RETURNING', template: 'DELETE FROM table_name\nWHERE id = 1\nRETURNING *;' },
    ],
  },
  {
    category: 'DDL',
    items: [
      { name: 'Create Table', template: 'CREATE TABLE table_name (\n  id SERIAL PRIMARY KEY,\n  name VARCHAR(255) NOT NULL,\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);' },
      { name: 'Create Index', template: 'CREATE INDEX idx_table_name_column\nON table_name (column_name);' },
      { name: 'Alter Table Add Column', template: 'ALTER TABLE table_name\nADD COLUMN new_column VARCHAR(255);' },
    ],
  },
];

export function QueryTemplates({ onSelectTemplate }: QueryTemplatesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const handleSelect = (template: string) => {
    onSelectTemplate(template);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1"
      >
        <FileCode data-icon="inline-start" className="size-4" />
        Templates
        <ChevronDown className={`size-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-1 w-72 rounded-3xl border bg-card p-2 shadow-lg">
            <div className="max-h-80 overflow-auto">
              {TEMPLATES.map((category) => (
                <div key={category.category} className="mb-1">
                  <button
                    type="button"
                    onClick={() => setExpandedCategory(
                      expandedCategory === category.category ? null : category.category
                    )}
                    className="flex w-full items-center justify-between rounded-2xl px-3 py-2 text-sm font-medium hover:bg-muted"
                  >
                    {category.category}
                    <ChevronDown
                      className={`size-4 transition-transform ${
                        expandedCategory === category.category ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {expandedCategory === category.category && (
                    <div className="ml-2 mt-1 space-y-1">
                      {category.items.map((item) => (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => handleSelect(item.template)}
                          className="w-full rounded-2xl px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          {item.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
