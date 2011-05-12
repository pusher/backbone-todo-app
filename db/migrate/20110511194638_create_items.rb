class CreateItems < ActiveRecord::Migration
  def self.up
    create_table :items do |t|
      t.text :shortdesc
      t.text :longdesc
      t.boolean :isdone
      t.references :list

      t.timestamps
    end
  end

  def self.down
    drop_table :items
  end
end
